import { Timestamp } from 'firebase/firestore';

export type CourseAccessType = 'free' | 'paid' | 'subscription' | 'exam_pass' | 'private';

export type LessonType = 'video' | 'pdf' | 'text' | 'quiz' | 'test' | 'live';

export interface Lesson {
    id: string;
    courseId: string;
    moduleId: string;
    title: string;
    description?: string;
    type: LessonType;
    order: number;
    durationMinutes?: number;
    isFreePreview: boolean;
    isMandatory: boolean;
    
    // Video content
    videoProvider?: 'cloudinary' | 'youtube' | 'hls';
    videoAssetId?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    
    // PDF resource
    pdfUrl?: string;
    allowDownload?: boolean;
    
    // Rich text
    textContent?: string;
    
    // Test attachment
    attachedTestId?: string;
    
    status: 'draft' | 'published';
    createdAt?: Timestamp | any;
    updatedAt?: Timestamp | any;
}

export interface CourseModule {
    id: string;
    courseId: string;
    title: string;
    description?: string;
    order: number;
    isPublished: boolean;
    totalLessons: number;
    createdAt?: Timestamp | any;
    updatedAt?: Timestamp | any;
}

export interface Course {
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    description?: string;
    overviewMarkdown?: string;
    
    examCategory: string;
    examSubCategory?: string;
    
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
    language: 'Hindi' | 'English' | 'Hinglish';
    
    thumbnailUrl: string;
    bannerUrl?: string;
    introVideoUrl?: string;
    
    instructor: {
        name: string;
        title: string;
        avatarUrl?: string;
        bio?: string;
    };
    
    accessType: CourseAccessType;
    
    pricing?: {
        amount: number;
        originalPrice?: number;
        currency: 'INR';
    };
    
    subscriptionPlanIds?: string[];
    examPassIds?: string[];
    
    status: 'draft' | 'review' | 'published' | 'archived';
    
    durationMinutes: number;
    totalLessons: number;
    totalModules: number;
    
    rating?: number;
    ratingCount?: number;
    
    stats?: {
        totalEnrollments: number;
        rating: number;
        totalLessons: number;
        totalDurationMinutes: number;
    };
    
    isFeatured?: boolean;
    
    createdAt?: Timestamp | any;
    updatedAt?: Timestamp | any;
}

export interface CourseEnrollment {
    id: string;
    userId: string;
    courseId: string;
    courseTitle: string;
    thumbnailUrl?: string;
    
    source: 'free' | 'purchase' | 'subscription' | 'exam_pass' | 'admin';
    paymentId?: string;
    subscriptionId?: string;
    examPassId?: string;
    amountPaid?: number;
    
    status: 'active' | 'expired' | 'revoked' | 'completed';
    
    enrolledAt: Timestamp | any;
    expiresAt?: Timestamp | any;
    completedAt?: Timestamp | any;
    
    lastAccessedLessonId?: string;
    progressPercent: number;
}

export interface LessonProgress {
    userId: string;
    courseId: string;
    lessonId: string;
    watchedSeconds?: number;
    completed: boolean;
    firstAccessedAt?: Timestamp | any;
    lastAccessedAt?: Timestamp | any;
    completedAt?: Timestamp | any;
}

export interface CourseCertificate {
    id: string; // Certificate ID e.g. EXM-CERT-12345
    userId: string;
    userName: string;
    courseId: string;
    courseTitle: string;
    issuedAt: Timestamp | any;
    completionDate: Timestamp | any;
    status: 'valid' | 'revoked';
}
