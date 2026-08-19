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
    writeBatch,
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

// Helper to sort demo test series to the top
export const sortTestSeriesWithDemoFirst = (seriesList: TestSeries[]): TestSeries[] => {
    return [...seriesList].sort((a, b) => {
        const getDemoScore = (item: TestSeries) => {
            const nameMatch = item.name?.toLowerCase().includes('demo') || (item as any).isDemo;
            if (nameMatch) return 2;
            if (item.pricing?.type === 'free' || item.pricing?.amount === 0) return 1;
            return 0;
        };
        const scoreA = getDemoScore(a);
        const scoreB = getDemoScore(b);
        if (scoreA !== scoreB) {
            return scoreB - scoreA;
        }
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
    });
};

let testSeriesCache: { data: TestSeries[], timestamp: number } | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache

// Get all test series
export const getAllTestSeries = async (filters?: {
    examCategory?: string;
    status?: string;
    createdBy?: string;
}): Promise<TestSeries[]> => {
    // Check if we can use the cache (only if no specific filters like createdBy are applied, or we are just fetching 'published')
    const isCacheableRequest = !filters || (Object.keys(filters).length === 1 && filters.status === 'published');
    
    if (isCacheableRequest && testSeriesCache && (Date.now() - testSeriesCache.timestamp < CACHE_DURATION_MS)) {
        return testSeriesCache.data;
    }

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

    // Sort client-side: Demo series at top, then newest first
    const sortedSeries = sortTestSeriesWithDemoFirst(series);

    if (isCacheableRequest) {
        testSeriesCache = {
            data: sortedSeries,
            timestamp: Date.now()
        };
    }

    return sortedSeries;
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

    try {
        // Get original tests
        const originalTests = await getTestsBySeriesId(seriesId);
        console.log(`Original tests fetched for cloning: ${originalTests?.length || 0}`);

        if (originalTests && originalTests.length > 0) {
            const newTestIds: string[] = [];

            // We split writes into batches of 400 (well within Firestore's 500 limit)
            const BATCH_SIZE = 400;
            for (let i = 0; i < originalTests.length; i += BATCH_SIZE) {
                const chunk = originalTests.slice(i, i + BATCH_SIZE);
                const batch = writeBatch(db);

                for (const test of chunk) {
                    // Destructure to exclude unique/system fields
                    const { id, createdAt, updatedAt, stats, seriesId: _, ...rest } = test as any;

                    const testData: any = {
                        ...rest,
                        seriesId: newSeriesId,
                        createdBy: userId,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                        stats: {
                            totalAttempts: 0,
                            averageScore: 0,
                            averageTime: 0
                        }
                    };

                    // Clean any undefined fields so Firestore doesn't reject the write operation
                    Object.keys(testData).forEach(key => {
                        if (testData[key] === undefined) {
                            delete testData[key];
                        }
                    });

                    // Generate a new document reference with auto-generated ID
                    const newTestDocRef = doc(collection(db, 'tests'));
                    batch.set(newTestDocRef, testData);
                    newTestIds.push(newTestDocRef.id);
                }

                // Commit the batch of writes to Firestore in a single atomic request
                await batch.commit();
            }

            // Update new series with duplicated test IDs and stats
            const newSeriesRef = doc(db, TEST_SERIES_COLLECTION, newSeriesId);
            await updateDoc(newSeriesRef, {
                testIds: newTestIds,
                'stats.totalTests': newTestIds.length,
                updatedAt: serverTimestamp()
            });
            console.log(`Successfully duplicated ${newTestIds.length} tests to new series ${newSeriesId}`);
        }
    } catch (err: any) {
        console.error('Error during test cloning loop:', err);
        alert('Test cloning failed: ' + (err.message || err));
        throw err;
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
