import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    serverTimestamp,
    query,
    where
} from 'firebase/firestore';
import { db } from '../firebase';
import type { LessonProgress, CourseEnrollment } from '../types/course.types';
import { curriculumService } from './curriculumService';
import { certificateService } from './certificateService';

export const progressService = {
    /**
     * Get student progress map for a course (lessonId -> LessonProgress)
     */
    getCourseProgressMap: async (userId: string, courseId: string): Promise<Record<string, LessonProgress>> => {
        try {
            const progressRef = collection(db, 'users', userId, 'courseProgress', courseId, 'lessons');
            const snapshot = await getDocs(progressRef);
            const map: Record<string, LessonProgress> = {};
            snapshot.docs.forEach(docSnap => {
                map[docSnap.id] = docSnap.data() as LessonProgress;
            });
            return map;
        } catch (error) {
            console.error("Error fetching course progress map:", error);
            return {};
        }
    },

    /**
     * Mark a lesson as completed / update progress
     */
    markLessonProgress: async (
        userId: string,
        courseId: string,
        lessonId: string,
        completed: boolean,
        watchedSeconds?: number,
        userName?: string,
        courseTitle?: string
    ): Promise<number> => {
        try {
            const lessonProgressRef = doc(db, 'users', userId, 'courseProgress', courseId, 'lessons', lessonId);
            const existingSnap = await getDoc(lessonProgressRef);

            const progressData: LessonProgress = {
                userId,
                courseId,
                lessonId,
                completed,
                watchedSeconds: watchedSeconds || 0,
                lastAccessedAt: serverTimestamp(),
                firstAccessedAt: existingSnap.exists() ? (existingSnap.data().firstAccessedAt || serverTimestamp()) : serverTimestamp(),
                completedAt: completed ? serverTimestamp() : (existingSnap.data()?.completedAt || null)
            };

            await setDoc(lessonProgressRef, progressData, { merge: true });

            // Recalculate progress percentage for enrollment
            const fullCurriculum = await curriculumService.getAllCourseLessons(courseId);
            let totalLessons = 0;
            const mandatoryLessonIds: string[] = [];

            fullCurriculum.forEach(item => {
                item.lessons.forEach(l => {
                    totalLessons++;
                    if (l.isMandatory !== false) {
                        mandatoryLessonIds.push(l.id);
                    }
                });
            });

            if (totalLessons === 0) return 100;

            const progressMap = await progressService.getCourseProgressMap(userId, courseId);
            const completedCount = Object.values(progressMap).filter(p => p.completed).length;
            const progressPercent = Math.min(100, Math.round((completedCount / totalLessons) * 100));

            // Update enrollment document
            const enrollmentsRef = collection(db, 'users', userId, 'enrollments');
            const q = query(enrollmentsRef, where('courseId', '==', courseId));
            const enrollSnap = await getDocs(q);

            if (!enrollSnap.empty) {
                const enrollDoc = enrollSnap.docs[0];
                const updateData: any = {
                    progressPercent,
                    lastAccessedLessonId: lessonId
                };

                if (progressPercent >= 100) {
                    updateData.status = 'completed';
                    updateData.completedAt = serverTimestamp();

                    // Issue Certificate if not already issued
                    if (userName && courseTitle) {
                        await certificateService.issueCertificate(userId, userName, courseId, courseTitle);
                    }
                }

                await updateDoc(doc(db, 'users', userId, 'enrollments', enrollDoc.id), updateData);
            }

            return progressPercent;
        } catch (error) {
            console.error("Error updating lesson progress:", error);
            throw error;
        }
    }
};
