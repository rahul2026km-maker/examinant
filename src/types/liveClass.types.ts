export interface LiveClass {
    id: string;
    title: string;
    description?: string;
    educatorName: string;
    educatorAvatar?: string;
    subject: string;
    examCategory: string;
    scheduledStartTime: string; // ISO 8601 string or format
    durationMinutes: number;
    streamUrl: string; // YouTube Live URL / embed / custom URL
    streamProvider: 'youtube' | 'custom' | 'zoom';
    thumbnailUrl?: string;
    status: 'upcoming' | 'live' | 'completed' | 'cancelled';
    recordingUrl?: string; // replay URL for past recordings
    activeViewers?: number;
    createdAt?: any;
    updatedAt?: any;
}

export interface LiveClassFormData {
    title: string;
    description?: string;
    educatorName: string;
    educatorAvatar?: string;
    subject: string;
    examCategory: string;
    scheduledStartTime: string;
    durationMinutes: number;
    streamUrl: string;
    streamProvider: 'youtube' | 'custom' | 'zoom';
    thumbnailUrl?: string;
    status: 'upcoming' | 'live' | 'completed';
    recordingUrl?: string;
}
