import { Timestamp } from 'firebase/firestore';

// Test Series Types
export interface TestSeries {
    id: string;
    name: string;
    examCategory: 'JEE' | 'NEET' | 'SSC' | string;
    examSubCategory?: string;
    pricing: {
        type: 'free' | 'paid';
        amount?: number;
        currency?: string;
    };
    description: string;
    features?: string[];
    testIds: string[]; // Array of test IDs in this series
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    status: 'draft' | 'published' | 'archived';
    thumbnailUrl?: string;
    stats?: {
        totalTests: number;
        totalAttempts: number;
        averageScore: number;
    };
}

// Test Types
export interface Test {
    id: string;
    seriesId: string; // Parent test series ID
    name: string;
    testType: 'practice' | 'mock' | 'previous_year';
    generationType: 'auto' | 'custom';

    // Auto-generation configuration
    autoConfig?: AutoGenerationConfig;

    // Custom topic configuration
    customConfig?: CustomTopicConfig;

    // Question configuration
    questionConfig: QuestionConfiguration;

    // Test settings
    settings: TestSettings;

    // Scheduling
    schedule?: TestSchedule;

    // Generated/selected questions
    questionIds: string[]; // Question IDs

    // Metadata
    status: 'draft' | 'published';
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    publishedAt?: Timestamp;

    // Stats
    stats?: {
        totalAttempts: number;
        averageScore: number;
        averageTime: number;
    };
}

// Auto-generation configuration
export interface AutoGenerationConfig {
    subjects: ('Physics' | 'Chemistry' | 'Mathematics')[];
    totalQuestions: number;
    questionsPerSubject: number;
    useWeightage: boolean; // Use JEE Mains 2024 weightage
    class?: '11' | '12' | 'both';
}

// Custom topic configuration
export interface CustomTopicConfig {
    subjects: string[];
    selectedUnits: Record<string, string[]>; // subject -> unit names
    selectedChapters: Record<string, string[]>; // subject -> chapter names
    selectedTopics: Record<string, string[]>; // chapter -> topic names
    questionSelection: 'all' | 'specific';
    selectedQuestionIds?: string[]; // If specific selection
}

// Question configuration
export interface QuestionConfiguration {
    totalQuestions: number;
    mcqPercentage: number; // 0-100
    numericalPercentage: number; // 0-100 (auto-calculated)
    difficultyDistribution?: {
        easy: number;
        medium: number;
        hard: number;
    };
}

// Test settings
export interface TestSettings {
    duration: number; // in minutes
    marksPerQuestion: number;
    negativeMarking: number;
    passingPercentage?: number;
    instructions?: string;
    allowReview: boolean;
    showSolutions: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    enableSectionTimers?: boolean;
    sectionDurations?: Record<string, number>;
}

// Test schedule
export interface TestSchedule {
    isScheduled: boolean;
    startDate?: Timestamp;
    endDate?: Timestamp;
    timezone?: string;
}

// Form data for creation/editing
export interface TestSeriesFormData {
    name: string;
    examCategory: 'JEE' | 'NEET' | 'SSC' | string;
    examSubCategory?: string;
    pricing: {
        type: 'free' | 'paid';
        amount?: number;
    };
    description: string;
    status: 'draft' | 'published' | 'archived';
    thumbnailUrl?: string;
}

export interface TestFormData {
    name: string;
    seriesId: string;
    testType: 'practice' | 'mock' | 'previous_year';
    generationType: 'auto' | 'custom';
    autoConfig?: Partial<AutoGenerationConfig>;
    customConfig?: Partial<CustomTopicConfig>;
    questionConfig: QuestionConfiguration;
    settings: TestSettings;
    schedule?: Partial<TestSchedule>;
    status: 'draft' | 'published';
}

// Wizard step state
export interface TestWizardState {
    currentStep: number;
    totalSteps: number;
    formData: Partial<TestFormData>;
    isValid: boolean;
    errors: Record<string, string>;
}
