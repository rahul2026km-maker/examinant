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
    orderBy,
    serverTimestamp,
    limit
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Course } from '../types/course.types';

const COURSES_COLLECTION = 'courses';

// Client-side cache for published courses
let publishedCoursesCache: { data: Course[]; timestamp: number } | null = null;
const CACHE_DURATION_MS = 3 * 60 * 1000; // 3 minutes

export const courseService = {
    /**
     * Get all published courses for public website & catalog
     */
    getPublishedCourses: async (filters?: {
        examCategory?: string;
        level?: string;
        language?: string;
        accessType?: string;
        searchTerm?: string;
    }): Promise<Course[]> => {
        try {
            // Use cache if available and no specific filter
            const hasSpecificFilters = filters?.examCategory || filters?.level || filters?.language || filters?.accessType || filters?.searchTerm;
            
            if (!hasSpecificFilters && publishedCoursesCache && (Date.now() - publishedCoursesCache.timestamp < CACHE_DURATION_MS)) {
                return publishedCoursesCache.data;
            }

            let q = query(
                collection(db, COURSES_COLLECTION),
                where('status', '==', 'published')
            );

            if (filters?.examCategory && filters.examCategory !== 'All') {
                q = query(q, where('examCategory', '==', filters.examCategory));
            }

            const snapshot = await getDocs(q);
            let courses = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Course[];

            // Apply additional in-memory filters
            if (filters?.level && filters.level !== 'All') {
                courses = courses.filter(c => c.level === filters.level);
            }
            if (filters?.language && filters.language !== 'All') {
                courses = courses.filter(c => c.language === filters.language);
            }
            if (filters?.accessType && filters.accessType !== 'All') {
                courses = courses.filter(c => c.accessType === filters.accessType);
            }
            if (filters?.searchTerm && filters.searchTerm.trim() !== '') {
                const term = filters.searchTerm.toLowerCase();
                courses = courses.filter(c => 
                    c.title.toLowerCase().includes(term) || 
                    c.shortDescription?.toLowerCase().includes(term) ||
                    c.examCategory?.toLowerCase().includes(term)
                );
            }

            // Cache result if unfiltered
            if (!hasSpecificFilters) {
                publishedCoursesCache = {
                    data: courses,
                    timestamp: Date.now()
                };
            }

            return courses;
        } catch (error) {
            console.error("Error fetching published courses:", error);
            throw error;
        }
    },

    /**
     * Get all courses for Admin management
     */
    getAllAdminCourses: async (): Promise<Course[]> => {
        try {
            const q = query(collection(db, COURSES_COLLECTION));
            const snapshot = await getDocs(q);
            const courses = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Course[];
            
            // Sort client side (newest first)
            return courses.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            });
        } catch (error) {
            console.error("Error fetching admin courses:", error);
            throw error;
        }
    },

    /**
     * Get course by ID
     */
    getCourseById: async (courseId: string): Promise<Course | null> => {
        try {
            const docRef = doc(db, COURSES_COLLECTION, courseId);
            const snapshot = await getDoc(docRef);
            if (!snapshot.exists()) return null;
            return {
                id: snapshot.id,
                ...snapshot.data()
            } as Course;
        } catch (error) {
            console.error("Error fetching course by ID:", error);
            return null;
        }
    },

    /**
     * Get course by slug (SEO friendly)
     */
    getCourseBySlug: async (slug: string): Promise<Course | null> => {
        try {
            const q = query(
                collection(db, COURSES_COLLECTION),
                where('slug', '==', slug),
                limit(1)
            );
            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;
            const docSnap = snapshot.docs[0];
            return {
                id: docSnap.id,
                ...docSnap.data()
            } as Course;
        } catch (error) {
            console.error("Error fetching course by slug:", error);
            return null;
        }
    },

    /**
     * Create a new course (Admin)
     */
    createCourse: async (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        try {
            const docData = {
                ...courseData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                totalLessons: courseData.totalLessons || 0,
                totalModules: courseData.totalModules || 0,
                durationMinutes: courseData.durationMinutes || 0,
                stats: courseData.stats || {
                    totalEnrollments: 0,
                    rating: 4.8,
                    totalLessons: 0,
                    totalDurationMinutes: 0
                }
            };
            const docRef = await addDoc(collection(db, COURSES_COLLECTION), docData);
            publishedCoursesCache = null; // Invalidate cache
            return docRef.id;
        } catch (error) {
            console.error("Error creating course:", error);
            throw error;
        }
    },

    /**
     * Update an existing course (Admin)
     */
    updateCourse: async (courseId: string, updates: Partial<Course>): Promise<void> => {
        try {
            const docRef = doc(db, COURSES_COLLECTION, courseId);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            publishedCoursesCache = null; // Invalidate cache
        } catch (error) {
            console.error("Error updating course:", error);
            throw error;
        }
    },

    /**
     * Archive course (Non-destructive delete)
     */
    archiveCourse: async (courseId: string): Promise<void> => {
        try {
            const docRef = doc(db, COURSES_COLLECTION, courseId);
            await updateDoc(docRef, {
                status: 'archived',
                updatedAt: serverTimestamp()
            });
            publishedCoursesCache = null;
        } catch (error) {
            console.error("Error archiving course:", error);
            throw error;
        }
    }
};
