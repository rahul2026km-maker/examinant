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
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { TestSeries, TestSeriesFormData, Test } from '../types/test.types';

const TEST_SERIES_COLLECTION = 'testSeries';

// Create a new test series
export const createTestSeries = async (data: TestSeriesFormData, userId: string): Promise<string> => {
    const testSeriesData = {
        ...data,
        testIds: [],
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stats: {
            totalTests: 0,
            totalAttempts: 0,
            averageScore: 0
        }
    };

    const docRef = await addDoc(collection(db, TEST_SERIES_COLLECTION), testSeriesData);
    return docRef.id;
};

// Update test series
export const updateTestSeries = async (seriesId: string, data: Partial<TestSeriesFormData>): Promise<void> => {
    const seriesRef = doc(db, TEST_SERIES_COLLECTION, seriesId);
    await updateDoc(seriesRef, {
        ...data,
        updatedAt: serverTimestamp()
    });
};

// Delete test series
export const deleteTestSeries = async (seriesId: string): Promise<void> => {
    const seriesRef = doc(db, TEST_SERIES_COLLECTION, seriesId);
    await deleteDoc(seriesRef);
};

// Get single test series
export const getTestSeries = async (seriesId: string): Promise<TestSeries | null> => {
    const seriesRef = doc(db, TEST_SERIES_COLLECTION, seriesId);
    const seriesDoc = await getDoc(seriesRef);

    if (!seriesDoc.exists()) {
        return null;
    }

    return {
        id: seriesDoc.id,
        ...seriesDoc.data()
    } as TestSeries;
};

// Get all test series
export const getAllTestSeries = async (filters?: {
    examCategory?: string;
    status?: string;
    createdBy?: string;
}): Promise<TestSeries[]> => {
    // Note: Removed server-side sorting to prevent composite index errors when filtering
    let q = query(collection(db, "testSeries"));

    if (filters?.examCategory) {
        q = query(q, where('examCategory', '==', filters.examCategory));
    }

    if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
    }

    if (filters?.createdBy) {
        q = query(q, where('createdBy', '==', filters.createdBy));
    }

    const snapshot = await getDocs(q);
    const series = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as TestSeries[];

    // Sort client-side
    return series.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
    });
};

// Add test to series
export const addTestToSeries = async (seriesId: string, testId: string): Promise<void> => {
    const seriesRef = doc(db, TEST_SERIES_COLLECTION, seriesId);
    const series = await getTestSeries(seriesId);

    if (series) {
        const updatedTestIds = [...(series.testIds || []), testId];
        await updateDoc(seriesRef, {
            testIds: updatedTestIds,
            'stats.totalTests': updatedTestIds.length,
            updatedAt: serverTimestamp()
        });
    }
};

// Remove test from series
export const removeTestFromSeries = async (seriesId: string, testId: string): Promise<void> => {
    const seriesRef = doc(db, TEST_SERIES_COLLECTION, seriesId);
    const series = await getTestSeries(seriesId);

    if (series) {
        const updatedTestIds = (series.testIds || []).filter(id => id !== testId);
        await updateDoc(seriesRef, {
            testIds: updatedTestIds,
            'stats.totalTests': updatedTestIds.length,
            updatedAt: serverTimestamp()
        });
    }
};

// Update series stats
export const updateSeriesStats = async (
    seriesId: string,
    stats: { totalAttempts?: number; averageScore?: number }
): Promise<void> => {
    const seriesRef = doc(db, TEST_SERIES_COLLECTION, seriesId);
    await updateDoc(seriesRef, {
        'stats.totalAttempts': stats.totalAttempts,
        'stats.averageScore': stats.averageScore,
        updatedAt: serverTimestamp()
    });
};

// Duplicate test series
export const duplicateTestSeries = async (seriesId: string, newName: string, userId: string): Promise<string> => {
    const originalSeries = await getTestSeries(seriesId);

    if (!originalSeries) {
        throw new Error('Test series not found');
    }

    const duplicateData: TestSeriesFormData = {
        name: newName,
        examCategory: originalSeries.examCategory,
        pricing: originalSeries.pricing,
        description: originalSeries.description,
        status: 'draft'
    };

    const newSeriesId = await createTestSeries(duplicateData, userId);

    // Get original tests
    const originalTests = await getTestsBySeriesId(seriesId);

    if (originalTests && originalTests.length > 0) {
        const newTestIds: string[] = [];

        for (const test of originalTests) {
            const testData: any = {
                seriesId: newSeriesId,
                name: test.name,
                testType: test.testType,
                generationType: test.generationType,
                questionConfig: test.questionConfig,
                settings: test.settings,
                questionIds: test.questionIds || [],
                status: test.status || 'draft',
                createdBy: userId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                stats: {
                    totalAttempts: 0,
                    averageScore: 0,
                    averageTime: 0
                }
            };

            if (test.autoConfig) testData.autoConfig = test.autoConfig;
            if (test.customConfig) testData.customConfig = test.customConfig;
            if (test.schedule) testData.schedule = test.schedule;
            if (test.publishedAt) testData.publishedAt = test.publishedAt;

            const newTestDocRef = await addDoc(collection(db, 'tests'), testData);
            newTestIds.push(newTestDocRef.id);
        }

        // Update new series with duplicated test IDs and stats
        const newSeriesRef = doc(db, TEST_SERIES_COLLECTION, newSeriesId);
        await updateDoc(newSeriesRef, {
            testIds: newTestIds,
            'stats.totalTests': newTestIds.length,
            updatedAt: serverTimestamp()
        });
    }

    return newSeriesId;
};
// Get all tests for a series
export const getTestsBySeriesId = async (seriesId: string): Promise<Test[]> => {
    const q = query(
        collection(db, 'tests'),
        where('seriesId', '==', seriesId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Test[];
};
