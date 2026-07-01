import { Timestamp } from 'firebase/firestore';

// OMR Section configuration (e.g., Section A = MCQ, Section B = Numerical)
export interface OMRSection {
    id: string;
    name: string; // e.g., "Section A", "Physics Section A"
    subject?: string; // e.g., "Physics"
    questionCount: number;
    optionsPerQuestion: number; // 4 or 5
    marksCorrect: number; // e.g., 4
    marksWrong: number; // e.g., -1 (negative means deduction)
    marksUnattempted: number; // usually 0
    questionStartIndex: number; // 1-indexed, e.g., 1
    questionEndIndex: number; // 1-indexed, e.g., 20
}

// OMR Template — defines the layout/structure of the OMR sheet
export interface OMRTemplate {
    totalQuestions: number;
    optionsPerQuestion: number; // default options (can be overridden per section)
    sections: OMRSection[];
    examPattern: 'JEE_MAINS' | 'JEE_ADVANCED' | 'NEET' | 'SSC' | 'CUSTOM';
    questionPdfUrl?: string; // NEW: Added to support question displaying
}

// Question assignment for OMR (maps Q number to a question from bank)
export interface OMRQuestionMapping {
    serialNumber: number; // 1-indexed question number on OMR sheet
    questionId?: string; // Firestore question ID (optional — can be blank for pure OMR)
    questionText?: string; // Optional question text
    options?: string[]; // Optional array of options for MCQ
    subject?: string;
    chapter?: string;
    correctOption?: string; // 'A', 'B', 'C', 'D' or numeric for numerical
    type?: 'MCQ' | 'Numerical';
}

// Full OMR Test Document (stored in Firestore 'tests' collection)
export interface OMRTest {
    id: string;
    seriesId: string;
    name: string;
    isOMR: true; // Flag to distinguish from digital tests
    testType: 'practice' | 'mock' | 'previous_year' | 'full_length' | 'subject_wise' | 'unit_wise' | 'chapter_wise';
    omrTemplate: OMRTemplate;
    questionMappings: OMRQuestionMapping[];
    settings: {
        duration: number; // in minutes
        instructions?: string;
        passingPercentage?: number;
        showResultsImmediately: boolean;
    };
    schedule?: {
        isScheduled: boolean;
        startDate?: Timestamp;
        endDate?: Timestamp;
        startTime?: string;
        endTime?: string;
    };
    status: 'draft' | 'published';
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    stats?: {
        totalAttempts: number;
        averageScore: number;
    };
}

// Student's bubble answers on OMR sheet
// Key: question serial number (1-indexed), Value: selected option ('A','B','C','D') or numerical string
export type OMRBubbleAnswers = Record<number, string>;

// Result of a student's OMR attempt
export interface OMRAttemptResult {
    testId: string;
    testName: string;
    isOMR: true;
    studentId: string;
    answers: OMRBubbleAnswers;
    score: number;
    totalMarks: number;
    correctCount: number;
    wrongCount: number;
    unattemptedCount: number;
    sectionWiseScore: Record<string, { score: number; correct: number; wrong: number; unattempted: number }>;
    timeTakenSeconds: number;
    attemptDate: Timestamp;
}

// Form data used in OMR Test Creation Wizard
export interface OMRTestFormData {
    name: string;
    seriesId: string;
    testType: 'practice' | 'mock' | 'previous_year' | 'full_length' | 'subject_wise' | 'unit_wise' | 'chapter_wise';
    omrTemplate: Partial<OMRTemplate>;
    questionMappings: OMRQuestionMapping[];
    settings: {
        duration: number;
        instructions?: string;
        passingPercentage?: number;
        showResultsImmediately: boolean;
    };
    schedule?: {
        isScheduled: boolean;
        startDate?: string;
        endDate?: string;
        startTime?: string;
        endTime?: string;
    };
    status: 'draft' | 'published';
}

// Preset OMR templates for common exams
export const OMR_PRESETS: Record<string, Partial<OMRTemplate>> = {
    JEE_MAINS: {
        totalQuestions: 90,
        optionsPerQuestion: 4,
        examPattern: 'JEE_MAINS',
        sections: [
            { id: 'phy-a', name: 'Physics Section A', subject: 'Physics', questionCount: 20, optionsPerQuestion: 4, marksCorrect: 4, marksWrong: -1, marksUnattempted: 0, questionStartIndex: 1, questionEndIndex: 20 },
            { id: 'phy-b', name: 'Physics Section B', subject: 'Physics', questionCount: 10, optionsPerQuestion: 0, marksCorrect: 4, marksWrong: -1, marksUnattempted: 0, questionStartIndex: 21, questionEndIndex: 30 },
            { id: 'chem-a', name: 'Chemistry Section A', subject: 'Chemistry', questionCount: 20, optionsPerQuestion: 4, marksCorrect: 4, marksWrong: -1, marksUnattempted: 0, questionStartIndex: 31, questionEndIndex: 50 },
            { id: 'chem-b', name: 'Chemistry Section B', subject: 'Chemistry', questionCount: 10, optionsPerQuestion: 0, marksCorrect: 4, marksWrong: -1, marksUnattempted: 0, questionStartIndex: 51, questionEndIndex: 60 },
            { id: 'math-a', name: 'Mathematics Section A', subject: 'Mathematics', questionCount: 20, optionsPerQuestion: 4, marksCorrect: 4, marksWrong: -1, marksUnattempted: 0, questionStartIndex: 61, questionEndIndex: 80 },
            { id: 'math-b', name: 'Mathematics Section B', subject: 'Mathematics', questionCount: 10, optionsPerQuestion: 0, marksCorrect: 4, marksWrong: -1, marksUnattempted: 0, questionStartIndex: 81, questionEndIndex: 90 },
        ]
    },
    NEET: {
        totalQuestions: 180,
        optionsPerQuestion: 4,
        examPattern: 'NEET',
        sections: [
            { id: 'phy', name: 'Physics', subject: 'Physics', questionCount: 45, optionsPerQuestion: 4, marksCorrect: 4, marksWrong: -1, marksUnattempted: 0, questionStartIndex: 1, questionEndIndex: 45 },
            { id: 'chem', name: 'Chemistry', subject: 'Chemistry', questionCount: 45, optionsPerQuestion: 4, marksCorrect: 4, marksWrong: -1, marksUnattempted: 0, questionStartIndex: 46, questionEndIndex: 90 },
            { id: 'bio1', name: 'Botany', subject: 'Biology', questionCount: 45, optionsPerQuestion: 4, marksCorrect: 4, marksWrong: -1, marksUnattempted: 0, questionStartIndex: 91, questionEndIndex: 135 },
            { id: 'bio2', name: 'Zoology', subject: 'Biology', questionCount: 45, optionsPerQuestion: 4, marksCorrect: 4, marksWrong: -1, marksUnattempted: 0, questionStartIndex: 136, questionEndIndex: 180 },
        ]
    },
    CUSTOM: {
        totalQuestions: 50,
        optionsPerQuestion: 4,
        examPattern: 'CUSTOM',
        sections: [
            { id: 'sec1', name: 'Section A', questionCount: 50, optionsPerQuestion: 4, marksCorrect: 1, marksWrong: 0, marksUnattempted: 0, questionStartIndex: 1, questionEndIndex: 50 }
        ]
    }
};
