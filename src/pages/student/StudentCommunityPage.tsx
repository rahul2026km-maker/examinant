import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, MessageSquare, Bookmark, Plus,
    Search, CheckCircle2, Flame, Award, Sparkles,
    Send, HelpCircle, ShieldCheck,
    ThumbsUp, Radio, Compass, Lightbulb,
    Pin, Trophy, Share2, Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
    communityService,
    type CommunityPost,
    type Comment,
    type StudyRoom,
    DEFAULT_LEADERBOARD
} from '../../services/communityService';

export default function StudentCommunityPage() {
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;
    const currentUserId = currentUser?.uid || 'guest-user';
    const currentUserName = currentUser?.displayName || authContext?.profileData?.fullName || 'Aspirant';
    const currentUserAvatar = currentUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
    const selectedExam = authContext?.selectedExam || 'SSC CGL Tier 1';

    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [studyRooms, setStudyRooms] = useState<StudyRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedChannel, setSelectedChannel] = useState<'all' | 'doubts' | 'strategy' | 'discussions'>('all');
    const [selectedSubject, setSelectedSubject] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'trending' | 'latest' | 'unsolved'>('trending');
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<string>>(new Set());

    // New Post Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostSubject, setNewPostSubject] = useState('Quantitative Aptitude');
    const [newPostChannel, setNewPostChannel] = useState<'doubts' | 'discussions' | 'strategy'>('doubts');
    const [newPostTags, setNewPostTags] = useState('');

    // Study Room active state
    const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);

    // 1. Subscribe to real-time dynamic posts and study rooms from Firestore
    useEffect(() => {
        setIsLoading(true);
        const unsubscribePosts = communityService.subscribePosts((fetchedPosts) => {
            setPosts(fetchedPosts);
            setIsLoading(false);
        });

        const unsubscribeRooms = communityService.subscribeStudyRooms((fetchedRooms) => {
            setStudyRooms(fetchedRooms);
        });

        return () => {
            unsubscribePosts?.();
            unsubscribeRooms?.();
        };
    }, []);

    // Filter and sort posts
    const filteredPosts = posts.filter(post => {
        if (selectedChannel !== 'all' && post.channel !== selectedChannel) return false;
        if (selectedSubject !== 'All' && post.subject !== selectedSubject) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matches = post.title.toLowerCase().includes(q) ||
                post.content.toLowerCase().includes(q) ||
                post.tags.some(t => t.toLowerCase().includes(q)) ||
                post.author.toLowerCase().includes(q);
            if (!matches) return false;
        }
        if (sortBy === 'unsolved' && post.isSolved) return false;
        return true;
    }).sort((a, b) => {
        if (sortBy === 'trending') return (b.likes || 0) - (a.likes || 0);
        if (sortBy === 'latest') return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        return 0;
    });

    // Dynamic stats computation
    const totalDoubts = posts.filter(p => p.channel === 'doubts').length;
    const solvedDoubts = posts.filter(p => p.channel === 'doubts' && p.isSolved).length;
    const solvedRate = totalDoubts > 0 ? Math.round((solvedDoubts / totalDoubts) * 100) : 96;

    const handleToggleLike = async (post: CommunityPost) => {
        const isLiked = (post.likedBy || []).includes(currentUserId);
        
        // Optimistic update
        setPosts(prev => prev.map(p => {
            if (p.id === post.id) {
                const updatedLikedBy = isLiked
                    ? (p.likedBy || []).filter(id => id !== currentUserId)
                    : [...(p.likedBy || []), currentUserId];
                return {
                    ...p,
                    likedBy: updatedLikedBy,
                    likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1
                };
            }
            return p;
        }));

        await communityService.toggleLike(post.id, currentUserId, isLiked);
    };

    const handleToggleBookmark = (postId: string) => {
        setBookmarkedPostIds(prev => {
            const next = new Set(prev);
            if (next.has(postId)) {
                next.delete(postId);
            } else {
                next.add(postId);
            }
            return next;
        });
    };

    const handleAddComment = async (postId: string) => {
        const text = commentInputs[postId]?.trim();
        if (!text) return;

        const newComment: Omit<Comment, 'id'> = {
            author: currentUserName,
            authorId: currentUserId,
            avatar: currentUserAvatar,
            role: 'Aspirant',
            timeAgo: 'Just now',
            content: text,
            likes: 0
        };

        // Optimistic UI update
        const tempId = `temp-${Date.now()}`;
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    comments: [...(p.comments || []), { ...newComment, id: tempId }]
                };
            }
            return p;
        }));

        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        setExpandedComments(prev => ({ ...prev, [postId]: true }));

        try {
            await communityService.addComment(postId, newComment);
        } catch (err) {
            console.error('Failed to add comment dynamically:', err);
        }
    };

    const handleVotePoll = async (postId: string, optionId: string) => {
        setPosts(prev => prev.map(p => {
            if (p.id === postId && p.poll) {
                const voters = p.poll.voters || {};
                if (voters[currentUserId]) return p; // already voted

                const updatedOptions = (p.poll.options || []).map(opt =>
                    opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
                );
                return {
                    ...p,
                    poll: {
                        ...p.poll,
                        options: updatedOptions,
                        voters: { ...voters, [currentUserId]: optionId },
                        userVoted: optionId
                    }
                };
            }
            return p;
        }));

        await communityService.votePoll(postId, optionId, currentUserId);
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostTitle.trim() || !newPostContent.trim()) return;

        setIsSubmitting(true);
        const tagsArray = newPostTags
            .split(',')
            .map(t => t.trim().replace(/^#/, ''))
            .filter(Boolean);

        const postPayload: Omit<CommunityPost, 'id' | 'createdAt'> = {
            author: currentUserName,
            authorId: currentUserId,
            avatar: currentUserAvatar,
            badge: 'Aspirant',
            role: 'Aspirant',
            exam: selectedExam,
            subject: newPostSubject,
            channel: newPostChannel,
            timeAgo: 'Just now',
            title: newPostTitle.trim(),
            content: newPostContent.trim(),
            tags: tagsArray.length > 0 ? tagsArray : ['Discussion', 'PeerStudy'],
            isSolved: false,
            likes: 1,
            likedBy: [currentUserId],
            views: 1,
            comments: []
        };

        try {
            const docId = await communityService.createPost(postPayload);
            // Optimistic prepend
            const createdPost: CommunityPost = {
                ...postPayload,
                id: docId,
                createdAt: { seconds: Math.floor(Date.now() / 1000) }
            };
            setPosts(prev => [createdPost, ...prev]);

            setNewPostTitle('');
            setNewPostContent('');
            setNewPostTags('');
            setIsCreateModalOpen(false);
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to publish post. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStudyRoom = async (roomId: string) => {
        const isCurrentlyJoined = joinedRoomId === roomId;
        setJoinedRoomId(isCurrentlyJoined ? null : roomId);

        // Optimistic member count update
        setStudyRooms(prev => prev.map(room => {
            if (room.id === roomId) {
                return {
                    ...room,
                    activeMembers: isCurrentlyJoined
                        ? Math.max(0, room.activeMembers - 1)
                        : room.activeMembers + 1
                };
            }
            return room;
        }));

        await communityService.toggleStudyRoom(roomId, currentUserId, isCurrentlyJoined);
    };

    return (
        <div className="min-h-screen bg-[#070D1E] text-slate-100 -m-4 sm:-m-8 p-4 sm:p-8 space-y-8 font-sans selection:bg-orange-500 selection:text-white">

            {/* ========================================================================= */}
            {/* HERO & DYNAMIC COMMUNITY STATS BANNER                                     */}
            {/* ========================================================================= */}
            <div className="relative bg-gradient-to-br from-[#0B152B] via-[#0D1B3A] to-[#070D1E] border border-[#17274B] rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-hidden">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                    <div className="space-y-3 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                            <Sparkles size={14} className="text-orange-400" />
                            Live Firestore Community & Doubts
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                            Student Community & Doubt Solver
                        </h1>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Connect with active aspirants preparing for <span className="text-orange-400 font-semibold">{selectedExam}</span>.
                            Ask questions, share shortcuts, join live study rooms, and get verified mentor answers.
                        </p>
                    </div>

                    {/* Community Actions */}
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
                        >
                            <Plus size={18} />
                            <span>Ask Doubt / Post</span>
                        </button>
                    </div>
                </div>

                {/* Live Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-[#17274B]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
                            <Users size={18} />
                        </div>
                        <div>
                            <div className="text-lg font-black text-white">
                                {posts.length > 0 ? `${14200 + posts.length * 3}+` : '14,200+'}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-400">Active Aspirants</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                            <CheckCircle2 size={18} />
                        </div>
                        <div>
                            <div className="text-lg font-black text-white">{solvedRate}%</div>
                            <div className="text-[11px] font-semibold text-slate-400">Doubts Solved</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                            <Flame size={18} />
                        </div>
                        <div>
                            <div className="text-lg font-black text-white">&lt; 12 Mins</div>
                            <div className="text-[11px] font-semibold text-slate-400">Avg. Response Time</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
                            <Award size={18} />
                        </div>
                        <div>
                            <div className="text-lg font-black text-white">{posts.length} Posts</div>
                            <div className="text-[11px] font-semibold text-slate-400">Live Discussions</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* MAIN TWO-COLUMN LAYOUT (FEED + SIDEBAR WIDGETS)                          */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT & CENTER: FEED & CONTROLS (8 Cols) */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Navigation Filter Tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B152B] border border-[#17274B] p-2 rounded-2xl">
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { id: 'all', label: 'All Discussions', icon: <Compass size={15} /> },
                                { id: 'doubts', label: 'Doubt Solver', icon: <HelpCircle size={15} /> },
                                { id: 'strategy', label: 'Exam Strategy', icon: <Lightbulb size={15} /> },
                                { id: 'discussions', label: 'Polls & Chill', icon: <MessageSquare size={15} /> }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSelectedChannel(tab.id as any)}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                        selectedChannel === tab.id
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Sort Selector */}
                        <div className="flex items-center gap-1 bg-[#070D1E] px-2 py-1 rounded-xl border border-[#17274B]">
                            <button
                                onClick={() => setSortBy('trending')}
                                className={`text-[11px] font-bold px-2 py-1 rounded-lg ${sortBy === 'trending' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400'}`}
                            >
                                Trending
                            </button>
                            <button
                                onClick={() => setSortBy('latest')}
                                className={`text-[11px] font-bold px-2 py-1 rounded-lg ${sortBy === 'latest' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400'}`}
                            >
                                Latest
                            </button>
                            <button
                                onClick={() => setSortBy('unsolved')}
                                className={`text-[11px] font-bold px-2 py-1 rounded-lg ${sortBy === 'unsolved' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400'}`}
                            >
                                Unsolved
                            </button>
                        </div>
                    </div>

                    {/* Search & Subject Filters */}
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search doubts, formula shortcuts, questions, topics (#CompoundInterest)..."
                                className="w-full bg-[#0B152B] border border-[#17274B] focus:border-blue-500 pl-11 pr-4 py-3 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                            />
                        </div>

                        {/* Subject Chips */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                            {['All', 'Quantitative Aptitude', 'Reasoning', 'General Awareness', 'English', 'Physics', 'Mathematics'].map(subj => (
                                <button
                                    key={subj}
                                    onClick={() => setSelectedSubject(subj)}
                                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all ${
                                        selectedSubject === subj
                                            ? 'bg-[#15284F] text-blue-300 border border-blue-400/40'
                                            : 'bg-[#0B152B]/80 text-slate-400 border border-[#17274B] hover:text-slate-200'
                                    }`}
                                >
                                    {subj}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Posts Feed */}
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="bg-[#0B152B] border border-[#17274B] rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                <span className="text-xs text-slate-400 font-bold">Connecting to live student community feed...</span>
                            </div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="bg-[#0B152B] border border-[#17274B] rounded-3xl p-12 text-center space-y-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                                    <HelpCircle size={28} />
                                </div>
                                <h3 className="text-lg font-bold text-white">No discussions found</h3>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                    Be the first one to ask a question or share study tips for this category!
                                </p>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                                >
                                    <Plus size={16} />
                                    <span>Ask Question</span>
                                </button>
                            </div>
                        ) : (
                            filteredPosts.map(post => {
                                const isExpanded = !!expandedComments[post.id];
                                const hasLiked = (post.likedBy || []).includes(currentUserId);
                                const isBookmarked = bookmarkedPostIds.has(post.id);

                                return (
                                    <motion.div
                                        key={post.id}
                                        layout
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-[#0B152B] border border-[#17274B] hover:border-[#1E3A75] rounded-3xl p-5 sm:p-6 transition-all shadow-lg space-y-4"
                                    >
                                        {/* Post Top Header */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={post.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                                                    alt={post.author}
                                                    className="w-10 h-10 rounded-2xl object-cover border border-blue-500/20"
                                                />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-white">{post.author}</span>
                                                        {post.role === 'Educator' && (
                                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                                                Mentor
                                                            </span>
                                                        )}
                                                        {post.role === 'Top Ranker' && (
                                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                                Ranker
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                                        <span>{post.timeAgo || 'Recently'}</span>
                                                        <span>•</span>
                                                        <span className="text-blue-400 font-medium">{post.subject}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="flex items-center gap-2">
                                                {post.isPinned && (
                                                    <span className="flex items-center gap-1 text-[11px] font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-xl border border-orange-500/20">
                                                        <Pin size={12} />
                                                        Pinned
                                                    </span>
                                                )}
                                                {post.channel === 'doubts' && (
                                                    post.isSolved ? (
                                                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                                                            <CheckCircle2 size={12} />
                                                            Solved
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                                                            <HelpCircle size={12} />
                                                            Unsolved
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* Post Content */}
                                        <div className="space-y-2">
                                            <h3 className="font-bold text-base sm:text-lg text-white leading-snug hover:text-blue-300 transition-colors cursor-pointer">
                                                {post.title}
                                            </h3>
                                            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                                                {post.content}
                                            </p>
                                        </div>

                                        {/* Interactive Poll Section if Post has Poll */}
                                        {post.poll && (
                                            <div className="bg-[#070D1E] border border-[#17274B] p-4 rounded-2xl space-y-3">
                                                <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                                                    <Flame size={14} className="text-orange-400" />
                                                    <span>{post.poll.question}</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {post.poll.options.map(opt => {
                                                        const totalVotes = post.poll!.options.reduce((acc, o) => acc + (o.votes || 0), 0) || 1;
                                                        const pct = Math.round(((opt.votes || 0) / totalVotes) * 100);
                                                        const userVotedOpt = post.poll?.voters?.[currentUserId] || post.poll?.userVoted;
                                                        const isSelected = userVotedOpt === opt.id;

                                                        return (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => handleVotePoll(post.id, opt.id)}
                                                                className={`w-full text-left p-3 rounded-xl relative overflow-hidden transition-all border ${
                                                                    isSelected
                                                                        ? 'border-orange-500/50 bg-orange-500/10'
                                                                        : 'border-[#17274B] bg-[#0B152B] hover:border-blue-500/30'
                                                                }`}
                                                            >
                                                                {/* Animated Progress Fill */}
                                                                <div
                                                                    className="absolute top-0 bottom-0 left-0 bg-blue-600/20 transition-all duration-500"
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                                <div className="relative z-10 flex items-center justify-between text-xs font-bold">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-orange-400 bg-orange-500' : 'border-slate-500'}`}>
                                                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                                        </div>
                                                                        <span className={isSelected ? 'text-white font-black' : 'text-slate-300'}>{opt.text}</span>
                                                                    </div>
                                                                    <span className="text-slate-400">{pct}% ({opt.votes || 0})</span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {(post.tags || []).map(tag => (
                                                <span
                                                    key={tag}
                                                    className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 cursor-pointer"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Actions Bar */}
                                        <div className="flex items-center justify-between pt-3 border-t border-[#17274B] text-xs">
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => handleToggleLike(post)}
                                                    className={`flex items-center gap-1.5 font-bold transition-colors ${
                                                        hasLiked ? 'text-rose-400' : 'text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    <ThumbsUp size={15} className={hasLiked ? 'fill-rose-400' : ''} />
                                                    <span>{post.likes || 0} Upvotes</span>
                                                </button>

                                                <button
                                                    onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                                                    className="flex items-center gap-1.5 font-bold text-slate-400 hover:text-white transition-colors"
                                                >
                                                    <MessageSquare size={15} />
                                                    <span>{(post.comments || []).length} Answers</span>
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleToggleBookmark(post.id)}
                                                    className={`p-1.5 rounded-lg transition-colors ${
                                                        isBookmarked ? 'text-orange-400 bg-orange-500/10' : 'text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    <Bookmark size={16} className={isBookmarked ? 'fill-orange-400' : ''} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard?.writeText(window.location.href);
                                                        alert('Discussion link copied to clipboard!');
                                                    }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
                                                    title="Share discussion"
                                                >
                                                    <Share2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Comments Accordion */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="pt-4 border-t border-[#17274B] space-y-3"
                                                >
                                                    {(post.comments || []).length > 0 && (
                                                        <div className="space-y-3">
                                                            {(post.comments || []).map(comment => (
                                                                <div
                                                                    key={comment.id}
                                                                    className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                                                                        comment.isVerified
                                                                            ? 'bg-[#0E2046] border-blue-400/30 shadow-inner'
                                                                            : 'bg-[#070D1E] border-[#17274B]'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <img
                                                                                src={comment.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                                                                                alt={comment.author}
                                                                                className="w-6 h-6 rounded-full object-cover"
                                                                            />
                                                                            <span className="font-bold text-white">{comment.author}</span>
                                                                            {comment.isVerified && (
                                                                                <span className="flex items-center gap-0.5 text-[9px] font-black uppercase text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-400/30">
                                                                                    <ShieldCheck size={10} /> Verified Answer
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-slate-500 text-[10px]">{comment.timeAgo || 'Recently'}</span>
                                                                    </div>
                                                                    <p className="text-slate-300 leading-relaxed pl-8">
                                                                        {comment.content}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Add Comment Input */}
                                                    <div className="flex gap-2 pt-2">
                                                        <input
                                                            type="text"
                                                            value={commentInputs[post.id] || ''}
                                                            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleAddComment(post.id);
                                                            }}
                                                            placeholder="Write an answer or study tip..."
                                                            className="flex-1 bg-[#070D1E] border border-[#17274B] focus:border-blue-500 px-4 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                                                        />
                                                        <button
                                                            onClick={() => handleAddComment(post.id)}
                                                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
                                                        >
                                                            <Send size={13} />
                                                            <span>Reply</span>
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: VIRTUAL STUDY ROOMS + TOP SOLVERS + EDUCATOR AMAS (4 Cols) */}
                <div className="lg:col-span-4 space-y-6">

                    {/* VIRTUAL STUDY ROOMS WIDGET */}
                    <div className="bg-[#0B152B] border border-[#17274B] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                                <h3 className="font-black text-sm text-white uppercase tracking-wider">Virtual Study Rooms</h3>
                            </div>
                            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                                {studyRooms.length} Active
                            </span>
                        </div>

                        <p className="text-xs text-slate-400">
                            Join live pomodoro focus rooms and voice doubt sessions with peers.
                        </p>

                        <div className="space-y-3">
                            {studyRooms.map(room => {
                                const isJoined = joinedRoomId === room.id;
                                return (
                                    <div
                                        key={room.id}
                                        className="bg-[#070D1E] border border-[#17274B] p-3.5 rounded-2xl space-y-2.5"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className="text-xs font-bold text-white">{room.title}</h4>
                                                <span className="text-[10px] text-slate-400">{room.category}</span>
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                                {room.tag}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between pt-1">
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                                <Users size={12} className="text-emerald-400" />
                                                <span>{room.activeMembers} Studying</span>
                                            </div>

                                            <button
                                                onClick={() => handleToggleStudyRoom(room.id)}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                                                    isJoined
                                                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                                                }`}
                                            >
                                                {isJoined ? 'Leave Room' : 'Join Room'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* TOP DOUBT SOLVERS LEADERBOARD */}
                    <div className="bg-[#0B152B] border border-[#17274B] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Trophy size={16} className="text-amber-400" />
                                <h3 className="font-black text-sm text-white uppercase tracking-wider">Top Solvers</h3>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">This Month</span>
                        </div>

                        <div className="space-y-2.5">
                            {DEFAULT_LEADERBOARD.map(member => (
                                <div
                                    key={member.name}
                                    className="flex items-center justify-between p-2.5 rounded-2xl bg-[#070D1E] border border-[#17274B] hover:border-blue-500/30 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-5 text-center text-xs font-black text-slate-400">
                                            {member.medal || `#${member.rank}`}
                                        </span>
                                        <img
                                            src={member.avatar}
                                            alt={member.name}
                                            className="w-8 h-8 rounded-full object-cover border border-blue-500/20"
                                        />
                                        <div>
                                            <div className="text-xs font-bold text-white">{member.name}</div>
                                            <div className="text-[10px] text-emerald-400">{member.solved}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-black text-amber-400">{member.points}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* UPCOMING TOPPER AMAS & LIVE WORKSHOPS */}
                    <div className="bg-gradient-to-br from-[#0F234B] to-[#0A1633] border border-[#1E3A75] rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
                        <div className="flex items-center gap-2 text-orange-400">
                            <Radio size={16} className="animate-pulse" />
                            <span className="text-[11px] font-black uppercase tracking-wider">Upcoming Community AMA</span>
                        </div>
                        <h4 className="font-bold text-sm text-white">
                            Cracking SSC CGL Tier 1 in 90 Days: Ask All Doubts Live
                        </h4>
                        <p className="text-xs text-slate-300">
                            With AIR-14 Ananya Sharma (Excise Inspector). Get your mock test strategies reviewed.
                        </p>
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-[11px] font-semibold text-blue-300">Tomorrow at 7:00 PM</span>
                            <button
                                onClick={() => alert('Reminder set! You will receive a notification before the session.')}
                                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md"
                            >
                                Set Reminder
                            </button>
                        </div>
                    </div>

                    {/* COMMUNITY GUIDELINES CARD */}
                    <div className="bg-[#0B152B]/60 border border-[#17274B] rounded-2xl p-4 text-xs space-y-2 text-slate-400">
                        <div className="flex items-center gap-2 font-bold text-slate-300">
                            <ShieldCheck size={14} className="text-blue-400" />
                            <span>Community Code of Conduct</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                            Keep conversations civil, exam-focused, and supportive. Avoid sharing copyrighted test materials without permission.
                        </p>
                    </div>

                </div>

            </div>

            {/* ========================================================================= */}
            {/* ASK DOUBT / CREATE POST MODAL                                             */}
            {/* ========================================================================= */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg bg-[#0B152B] border border-[#1E3A75] rounded-[28px] p-6 shadow-2xl space-y-5"
                        >
                            <div className="flex items-center justify-between border-b border-[#17274B] pb-4">
                                <div>
                                    <h3 className="text-lg font-black text-white">Ask Doubt or Start Discussion</h3>
                                    <p className="text-xs text-slate-400">Reach peers and verified mentors across India</p>
                                </div>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleCreatePost} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                            Post Category
                                        </label>
                                        <select
                                            value={newPostChannel}
                                            onChange={(e) => setNewPostChannel(e.target.value as any)}
                                            className="w-full bg-[#070D1E] border border-[#17274B] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="doubts">Doubt / Question</option>
                                            <option value="strategy">Exam Strategy</option>
                                            <option value="discussions">General Discussion</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                            Subject
                                        </label>
                                        <select
                                            value={newPostSubject}
                                            onChange={(e) => setNewPostSubject(e.target.value)}
                                            className="w-full bg-[#070D1E] border border-[#17274B] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                                            <option value="Reasoning">Reasoning</option>
                                            <option value="General Awareness">General Awareness</option>
                                            <option value="English">English</option>
                                            <option value="General">General / Mock Tests</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                        Title / Question Headline
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newPostTitle}
                                        onChange={(e) => setNewPostTitle(e.target.value)}
                                        placeholder="e.g. Shortcut trick for Work & Time problem in Tier 1?"
                                        className="w-full bg-[#070D1E] border border-[#17274B] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                        Explanation / Problem Details
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        placeholder="Type the complete question or what step you got stuck on..."
                                        className="w-full bg-[#070D1E] border border-[#17274B] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                        Tags (comma separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={newPostTags}
                                        onChange={(e) => setNewPostTags(e.target.value)}
                                        placeholder="WorkAndTime, Quant, FormulaTrick"
                                        className="w-full bg-[#070D1E] border border-[#17274B] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                <span>Publishing...</span>
                                            </>
                                        ) : (
                                            <span>Publish to Community</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
