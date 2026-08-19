import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import type { CourseModule, Lesson } from '../types/course.types';
import { courseService } from './courseService';

export const curriculumService = {
    // ----------------------------------------------------
    // MODULE MANAGEMENT
    // ----------------------------------------------------

    /**
     * Get all modules for a course
     */
    getCourseModules: async (courseId: string): Promise<CourseModule[]> => {
        try {
            const modulesRef = collection(db, 'courses', courseId, 'modules');
            const q = query(modulesRef, orderBy('order', 'asc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as CourseModule[];
        } catch (error) {
            console.error("Error fetching course modules:", error);
            return [];
        }
    },

    /**
     * Create a module in a course
     */
    createModule: async (courseId: string, title: string, order: number, description?: string): Promise<string> => {
        try {
            const modulesRef = collection(db, 'courses', courseId, 'modules');
            const docRef = await addDoc(modulesRef, {
                courseId,
                title,
                description: description || '',
                order,
                isPublished: true,
                totalLessons: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Update module count in parent course
            const modules = await curriculumService.getCourseModules(courseId);
            await courseService.updateCourse(courseId, { totalModules: modules.length });

            return docRef.id;
        } catch (error) {
            console.error("Error creating module:", error);
            throw error;
        }
    },

    /**
     * Update module
     */
    updateModule: async (courseId: string, moduleId: string, updates: Partial<CourseModule>): Promise<void> => {
        try {
            const moduleRef = doc(db, 'courses', courseId, 'modules', moduleId);
            await updateDoc(moduleRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating module:", error);
            throw error;
        }
    },

    /**
     * Delete module and update count
     */
    deleteModule: async (courseId: string, moduleId: string): Promise<void> => {
        try {
            const moduleRef = doc(db, 'courses', courseId, 'modules', moduleId);
            await deleteDoc(moduleRef);
            const modules = await curriculumService.getCourseModules(courseId);
            await courseService.updateCourse(courseId, { totalModules: modules.length });
        } catch (error) {
            console.error("Error deleting module:", error);
            throw error;
        }
    },

    // ----------------------------------------------------
    // LESSON MANAGEMENT
    // ----------------------------------------------------

    /**
     * Get lessons for a specific module
     */
    getModuleLessons: async (courseId: string, moduleId: string): Promise<Lesson[]> => {
        try {
            const lessonsRef = collection(db, 'courses', courseId, 'modules', moduleId, 'lessons');
            const q = query(lessonsRef, orderBy('order', 'asc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as Lesson[];
        } catch (error) {
            console.error("Error fetching module lessons:", error);
            return [];
        }
    },

    /**
     * Get ALL lessons across all modules for a course
     */
    getAllCourseLessons: async (courseId: string): Promise<{ module: CourseModule; lessons: Lesson[] }[]> => {
        try {
            const modules = await curriculumService.getCourseModules(courseId);
            const result: { module: CourseModule; lessons: Lesson[] }[] = [];

            for (const mod of modules) {
                const lessons = await curriculumService.getModuleLessons(courseId, mod.id);
                result.push({ module: mod, lessons });
            }

            return result;
        } catch (error) {
            console.error("Error fetching full course curriculum:", error);
            return [];
        }
    },

    /**
     * Create a lesson inside a module
     */
    createLesson: async (courseId: string, moduleId: string, lessonData: Omit<Lesson, 'id' | 'courseId' | 'moduleId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        try {
            const lessonsRef = collection(db, 'courses', courseId, 'modules', moduleId, 'lessons');
            const docRef = await addDoc(lessonsRef, {
                ...lessonData,
                courseId,
                moduleId,
                status: 'published',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Recalculate totals for course
            await curriculumService.recalculateCourseStats(courseId);

            return docRef.id;
        } catch (error) {
            console.error("Error creating lesson:", error);
            throw error;
        }
    },

    /**
     * Update lesson
     */
    updateLesson: async (courseId: string, moduleId: string, lessonId: string, updates: Partial<Lesson>): Promise<void> => {
        try {
            const lessonRef = doc(db, 'courses', courseId, 'modules', moduleId, 'lessons', lessonId);
            await updateDoc(lessonRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            await curriculumService.recalculateCourseStats(courseId);
        } catch (error) {
            console.error("Error updating lesson:", error);
            throw error;
        }
    },

    /**
     * Delete lesson
     */
    deleteLesson: async (courseId: string, moduleId: string, lessonId: string): Promise<void> => {
        try {
            const lessonRef = doc(db, 'courses', courseId, 'modules', moduleId, 'lessons', lessonId);
            await deleteDoc(lessonRef);
            await curriculumService.recalculateCourseStats(courseId);
        } catch (error) {
            console.error("Error deleting lesson:", error);
            throw error;
        }
    },

    /**
     * Recalculate total lessons, total duration, and module lesson counts for a course
     */
    recalculateCourseStats: async (courseId: string): Promise<void> => {
        try {
            const fullCurriculum = await curriculumService.getAllCourseLessons(courseId);
            let totalLessons = 0;
            let totalDurationMinutes = 0;

            for (const item of fullCurriculum) {
                totalLessons += item.lessons.length;
                for (const l of item.lessons) {
                    totalDurationMinutes += (l.durationMinutes || 0);
                }
                // Update module's lesson count
                const moduleRef = doc(db, 'courses', courseId, 'modules', item.module.id);
                await updateDoc(moduleRef, { totalLessons: item.lessons.length });
            }

            await courseService.updateCourse(courseId, {
                totalLessons,
                durationMinutes: totalDurationMinutes,
                totalModules: fullCurriculum.length,
                'stats.totalLessons': totalLessons,
                'stats.totalDurationMinutes': totalDurationMinutes
            } as any);
        } catch (error) {
            console.error("Error recalculating course stats:", error);
        }
    }
};
