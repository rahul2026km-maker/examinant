import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
    increment,
    arrayUnion
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Comment {
    id: string;
    author: string;
    authorId?: string;
    avatar: string;
    role: string;
    timeAgo?: string;
    createdAt?: any;
    content: string;
    likes: number;
    isVerified?: boolean;
}

export interface PollOption {
    id: string;
    text: string;
    votes: number;
}

export interface CommunityPost {
    id: string;
    author: string;
    authorId?: string;
    avatar: string;
    badge: string;
    role: 'Mentor' | 'Top Ranker' | 'Aspirant' | 'Educator';
    exam: string;
    subject: string;
    channel: 'doubts' | 'discussions' | 'strategy' | 'notes';
    timeAgo?: string;
    createdAt?: any;
    title: string;
    content: string;
    tags: string[];
    isSolved?: boolean;
    isPinned?: boolean;
    likes: number;
    likedBy?: string[];
    views: number;
    comments: Comment[];
    poll?: {
        question: string;
        options: PollOption[];
        voters?: Record<string, string>; // userId -> optionId
        userVoted?: string;
    };
}

export interface StudyRoom {
    id: string;
    title: string;
    category: string;
    activeMembers: number;
    isLive: boolean;
    tag: string;
    joinedUserIds?: string[];
}

export interface LeaderboardMember {
    id: string;
    rank: number;
    name: string;
    points: string;
    solved: string;
    avatar: string;
    medal?: string;
}

const POSTS_COLLECTION = 'community_posts';
const ROOMS_COLLECTION = 'community_study_rooms';

// Default Seed Posts (Shown if Firestore collection is fresh)
export const DEFAULT_COMMUNITY_POSTS: CommunityPost[] = [
    {
        id: 'seed-post-1',
        author: 'Ankur Gautam',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        badge: 'Top 1% Solver',
        role: 'Top Ranker',
        exam: 'SSC CGL Tier 1',
        subject: 'Quantitative Aptitude',
        channel: 'doubts',
        timeAgo: '12 mins ago',
        isPinned: true,
        isSolved: true,
        title: 'Shortcut trick for Installment problems in Compound Interest?',
        content: 'Whenever I solve 3-year CI installment questions where rate is 10% or 12.5%, the fractional method takes almost 2 minutes. Is there an effective ratio shortcut or tabular method to solve it under 40 seconds for Tier 1?',
        tags: ['CompoundInterest', 'QuantShortcuts', 'SSCCGL2026'],
        likes: 48,
        likedBy: [],
        views: 640,
        comments: [
            {
                id: 'c-1',
                author: 'Vikram Rajput',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
                role: 'Verified Mentor',
                timeAgo: '8 mins ago',
                isVerified: true,
                content: 'Yes! Convert rate into fraction. For 10%, principal to amount ratio is 10:11. For 3 years, square and cube the ratios (100:121, 1000:1331) and equalize installment amounts by multiplying. I shared the full 1-page formula sheet in the Notes tab.',
                likes: 24
            },
            {
                id: 'c-2',
                author: 'Priya Sharma',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
                role: 'Aspirant',
                timeAgo: '4 mins ago',
                content: 'That ratio multiplier method saved me so much time in yesterday’s mock test! Highly recommend it.',
                likes: 6
            }
        ]
    },
    {
        id: 'seed-post-2',
        author: 'Rohit Verma',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
        badge: 'Educator',
        role: 'Educator',
        exam: 'SSC CGL Tier 1',
        subject: 'General Awareness',
        channel: 'strategy',
        timeAgo: '1 hour ago',
        isPinned: false,
        title: 'Last 6 Months Current Affairs Strategy: What to skip and what to memorize',
        content: 'Analysis of recent TCS pattern questions reveals heavy weightage on: 1) Govt Schemes & Portals (especially Ministry of Finance & Rural Development), 2) Appointments in Constitutional Bodies, 3) Military Exercises & Host Nations. Do not waste time memorizing local municipal announcements.',
        tags: ['CurrentAffairs', 'TCS_Pattern', 'RevisionChecklist'],
        likes: 112,
        likedBy: [],
        views: 1840,
        comments: [
            {
                id: 'c-3',
                author: 'Sneha Patel',
                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
                role: 'Aspirant',
                timeAgo: '35 mins ago',
                content: 'Sir, what about Awards & Honors? Are sports awards also critical for Tier 1?',
                likes: 8
            }
        ]
    },
    {
        id: 'seed-post-3',
        author: 'Examinant Study Team',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        badge: 'Official',
        role: 'Educator',
        exam: 'All Exams',
        subject: 'General',
        channel: 'discussions',
        timeAgo: '3 hours ago',
        title: 'Weekly Community Pulse: How many full-length mock tests did you complete this week?',
        content: 'Consistent mock practice followed by deep question-by-question analysis is the #1 predictor of clearing cutoffs. Cast your vote below!',
        tags: ['CommunityPoll', 'MockTestTracker', 'Consistency'],
        likes: 95,
        likedBy: [],
        views: 2430,
        poll: {
            question: 'How many mock tests did you attempt this week?',
            options: [
                { id: 'opt-1', text: '1 - 2 Full Mocks + Analysis', votes: 142 },
                { id: 'opt-2', text: '3 - 4 Full Mocks + Revision', votes: 289 },
                { id: 'opt-3', text: '5+ Intensive Mocks', votes: 94 },
                { id: 'opt-4', text: 'Focused only on sectional tests', votes: 76 }
            ],
            voters: {}
        },
        comments: []
    },
    {
        id: 'seed-post-4',
        author: 'Arjun Mehta',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
        badge: 'Doubt Champ',
        role: 'Aspirant',
        exam: 'SSC CGL Tier 1',
        subject: 'Reasoning',
        channel: 'doubts',
        timeAgo: '5 hours ago',
        isSolved: false,
        title: 'Syllogism: Only a few A are B vs All B can be A ambiguity',
        content: 'In statement: "Only a few books are pens. Some pens are pencils." Can all books ever be pencils without violating the condition? Please explain with Venn diagram representation if possible.',
        tags: ['Reasoning', 'Syllogism', 'Doubt'],
        likes: 22,
        likedBy: [],
        views: 410,
        comments: []
    }
];

export const DEFAULT_STUDY_ROOMS: StudyRoom[] = [
    {
        id: 'room-1',
        title: 'SSC CGL Focus & Silent Study Hub',
        category: 'Deep Focus (Pomodoro 50/10)',
        activeMembers: 48,
        isLive: true,
        tag: 'Silent',
        joinedUserIds: []
    },
    {
        id: 'room-2',
        title: 'Quant & DI Rapid Doubt Clearing Room',
        category: 'Live Voice & Screen Share',
        activeMembers: 24,
        isLive: true,
        tag: 'Doubt Jam',
        joinedUserIds: []
    },
    {
        id: 'room-3',
        title: 'Daily GK & Current Affairs Flash Quiz',
        category: 'Live Peer Quiz',
        activeMembers: 86,
        isLive: true,
        tag: 'Quiz',
        joinedUserIds: []
    }
];

export const DEFAULT_LEADERBOARD: LeaderboardMember[] = [
    { id: '1', rank: 1, name: 'Ananya Roy', points: '3,480 pts', solved: '184 Doubts', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80', medal: '🥇' },
    { id: '2', rank: 2, name: 'Kavita Chawla', points: '3,120 pts', solved: '162 Doubts', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80', medal: '🥈' },
    { id: '3', rank: 3, name: 'Devendra Joshi', points: '2,950 pts', solved: '141 Doubts', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80', medal: '🥉' },
    { id: '4', rank: 4, name: 'Rahul Singhania', points: '2,420 pts', solved: '118 Doubts', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80' },
];

function formatTimeAgo(timestamp: any): string {
    if (!timestamp) return 'Just now';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return 'Recently';

    const now = Date.now();
    const diff = Math.floor((now - date.getTime()) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
}

export const communityService = {
    // Realtime posts subscription
    subscribePosts(callback: (posts: CommunityPost[]) => void) {
        try {
            const colRef = collection(db, POSTS_COLLECTION);
            const q = query(colRef, orderBy('createdAt', 'desc'));

            return onSnapshot(q, (snapshot) => {
                if (snapshot.empty) {
                    callback(DEFAULT_COMMUNITY_POSTS);
                    return;
                }

                const posts: CommunityPost[] = snapshot.docs.map(docSnap => {
                    const data = docSnap.data();
                    return {
                        id: docSnap.id,
                        ...data,
                        timeAgo: data.createdAt ? formatTimeAgo(data.createdAt) : (data.timeAgo || 'Recently'),
                        comments: (data.comments || []).map((c: any) => ({
                            ...c,
                            timeAgo: c.createdAt ? formatTimeAgo(c.createdAt) : (c.timeAgo || 'Recently')
                        }))
                    } as CommunityPost;
                });

                callback(posts);
            }, (error) => {
                console.warn('Firestore community_posts subscription fallback:', error);
                callback(DEFAULT_COMMUNITY_POSTS);
            });
        } catch (error) {
            console.error('Error initiating community subscription:', error);
            callback(DEFAULT_COMMUNITY_POSTS);
            return () => {};
        }
    },

    // Create a new post / doubt
    async createPost(postData: Omit<CommunityPost, 'id' | 'createdAt'>): Promise<string> {
        try {
            const colRef = collection(db, POSTS_COLLECTION);
            const docRef = await addDoc(colRef, {
                ...postData,
                createdAt: serverTimestamp(),
                likes: postData.likes || 0,
                likedBy: postData.likedBy || [],
                views: postData.views || 1,
                comments: postData.comments || []
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating post in Firestore:', error);
            throw error;
        }
    },

    // Toggle Upvote on a post
    async toggleLike(postId: string, userId: string, currentlyLiked: boolean): Promise<void> {
        if (postId.startsWith('seed-post-')) {
            // Seed post: handled locally in UI state
            return;
        }

        try {
            const docRef = doc(db, POSTS_COLLECTION, postId);
            const snap = await getDoc(docRef);
            if (!snap.exists()) return;

            const data = snap.data();
            const likedBy: string[] = data.likedBy || [];
            const userIndex = likedBy.indexOf(userId);

            if (userIndex > -1) {
                likedBy.splice(userIndex, 1);
                await updateDoc(docRef, {
                    likes: Math.max(0, (data.likes || 1) - 1),
                    likedBy
                });
            } else {
                likedBy.push(userId);
                await updateDoc(docRef, {
                    likes: (data.likes || 0) + 1,
                    likedBy
                });
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    },

    // Add comment / answer to a post
    async addComment(postId: string, comment: Omit<Comment, 'id' | 'createdAt'>): Promise<void> {
        const commentObj: Comment = {
            ...comment,
            id: `c-${Date.now()}`,
            createdAt: new Date().toISOString(),
            timeAgo: 'Just now'
        };

        if (postId.startsWith('seed-post-')) {
            // Seed post handled locally in UI
            return;
        }

        try {
            const docRef = doc(db, POSTS_COLLECTION, postId);
            await updateDoc(docRef, {
                comments: arrayUnion(commentObj)
            });
        } catch (error) {
            console.error('Error adding comment to post:', error);
            throw error;
        }
    },

    // Cast vote in community poll
    async votePoll(postId: string, optionId: string, userId: string): Promise<void> {
        if (postId.startsWith('seed-post-')) {
            return;
        }

        try {
            const docRef = doc(db, POSTS_COLLECTION, postId);
            const snap = await getDoc(docRef);
            if (!snap.exists()) return;

            const postData = snap.data() as CommunityPost;
            if (!postData.poll) return;

            const voters = postData.poll.voters || {};
            if (voters[userId]) return; // already voted

            const updatedOptions = (postData.poll.options || []).map(opt =>
                opt.id === optionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
            );

            voters[userId] = optionId;

            await updateDoc(docRef, {
                'poll.options': updatedOptions,
                'poll.voters': voters
            });
        } catch (error) {
            console.error('Error voting in poll:', error);
        }
    },

    // Realtime study rooms subscription
    subscribeStudyRooms(callback: (rooms: StudyRoom[]) => void) {
        try {
            const colRef = collection(db, ROOMS_COLLECTION);
            return onSnapshot(colRef, (snapshot) => {
                if (snapshot.empty) {
                    callback(DEFAULT_STUDY_ROOMS);
                    return;
                }
                const rooms: StudyRoom[] = snapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                } as StudyRoom));
                callback(rooms);
            }, (err) => {
                console.warn('Study rooms subscription fallback:', err);
                callback(DEFAULT_STUDY_ROOMS);
            });
        } catch (error) {
            console.error('Error subscribing to study rooms:', error);
            callback(DEFAULT_STUDY_ROOMS);
            return () => {};
        }
    },

    // Join or Leave a study room
    async toggleStudyRoom(roomId: string, userId: string, currentlyJoined: boolean): Promise<void> {
        if (roomId.startsWith('room-')) {
            return;
        }
        try {
            const docRef = doc(db, ROOMS_COLLECTION, roomId);
            const snap = await getDoc(docRef);
            if (!snap.exists()) return;

            const roomData = snap.data();
            const joinedUserIds: string[] = roomData.joinedUserIds || [];
            const idx = joinedUserIds.indexOf(userId);

            if (idx > -1) {
                joinedUserIds.splice(idx, 1);
                await updateDoc(docRef, {
                    activeMembers: Math.max(0, (roomData.activeMembers || 1) - 1),
                    joinedUserIds
                });
            } else {
                joinedUserIds.push(userId);
                await updateDoc(docRef, {
                    activeMembers: (roomData.activeMembers || 0) + 1,
                    joinedUserIds
                });
            }
        } catch (error) {
            console.error('Error toggling study room:', error);
        }
    }
};
