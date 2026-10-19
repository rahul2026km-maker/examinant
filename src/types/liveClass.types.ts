export type StreamProvider = 'jitsi' | 'jaas' | 'youtube' | 'zoom' | 'custom';
export type LiveClassStatus = 'upcoming' | 'live' | 'completed' | 'cancelled';

export interface LiveClass {
    id: string;
    title: string;
    description?: string;
    educatorName: string;
    educatorAvatar?: string;
    subject: string;
    examCategory: string;
    batchId?: string;
    batchName?: string;
    scheduledStartTime: string; // ISO 8601 string or format
    durationMinutes: number;
    streamUrl: string; // YouTube Live URL / embed / custom URL / Jitsi room link
    streamProvider: StreamProvider;
    roomName?: string; // Sanitized unique Jitsi room name (e.g. examinant_live_cls123)
    startedAt?: string; // ISO string when instructor clicked 'Start Class'
    endedAt?: string; // ISO string when session was ended
    thumbnailUrl?: string;
    status: LiveClassStatus;
    recordingUrl?: string; // replay URL for past recordings (S3 / Cloudinary / YouTube)
    recordingDuration?: number;
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
    batchId?: string;
    batchName?: string;
    scheduledStartTime: string;
    durationMinutes: number;
    streamUrl: string;
    streamProvider: StreamProvider;
    roomName?: string;
    thumbnailUrl?: string;
    status: 'upcoming' | 'live' | 'completed';
    recordingUrl?: string;
}

export interface JitsiTokenResponse {
    token: string | null;
    mode: 'jaas' | 'jitsi_meet_direct';
    domain: string;
    appId?: string;
    roomName: string;
    isInstructor: boolean;
    jwtOptions?: any;
}

export interface LiveClassChatMessage {
    id: string;
    classId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    isFaculty: boolean;
    message: string;
    time: string;
    createdAt?: any;
}
