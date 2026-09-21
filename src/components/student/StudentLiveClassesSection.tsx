import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Radio,
    PlayCircle,
    Calendar,
    Clock,
    Users,
    Bell,
    Check,
    X,
    Send,
    ChevronRight,
    Video,
    BookOpen,
    MessageSquare
} from 'lucide-react';
import { liveClassService } from '../../services/liveClassService';
import type { LiveClass } from '../../types/liveClass.types';
import { VideoPlayer } from '../common/VideoPlayer';

interface LiveChatMessage {
    id: string;
    user: string;
    avatarBg: string;
    message: string;
    time: string;
    isFaculty?: boolean;
}

interface StudentLiveClassesSectionProps {
    targetExam?: string;
    userName?: string;
}

export const StudentLiveClassesSection: React.FC<StudentLiveClassesSectionProps> = ({
    targetExam = 'SSC',
    userName = 'Student'
}) => {
    const navigate = useNavigate();

    // Classes state from real-time Firestore subscription
    const [classes, setClasses] = useState<LiveClass[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'all' | 'live' | 'upcoming' | 'recordings'>('all');

    // Live Stream Player Modal state
    const [activeStreamingClass, setActiveStreamingClass] = useState<LiveClass | null>(null);

    // Dynamic fluctuating viewer count for active realism
    const [activeViewers, setActiveViewers] = useState<number>(248);

    // Chat state inside modal
    const [chatInput, setChatInput] = useState<string>('');
    const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([
        { id: '1', user: 'Examinant Moderator', avatarBg: 'bg-rose-600', message: 'Welcome students! Keep your formula notebooks ready for live problem drills.', time: '10:00 AM', isFaculty: true },
        { id: '2', user: 'Aryan Sharma', avatarBg: 'bg-blue-600', message: 'Good morning sir, ready for today\'s high-yield shortcuts!', time: '10:02 AM' },
        { id: '3', user: 'Priya Verma', avatarBg: 'bg-emerald-600', message: 'Audio and board clarity is excellent today 🚀', time: '10:04 AM' },
        { id: '4', user: 'Rohan Gupta', avatarBg: 'bg-purple-600', message: 'Sir will the class PDF notes be available right after this stream?', time: '10:05 AM' }
    ]);

    // Reminders state persisted in localStorage
    const [reminders, setReminders] = useState<Record<string, boolean>>(() => {
        try {
            const saved = localStorage.getItem('examinant_live_reminders');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    // Toast notification state
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Subscribe to Firestore live classes in real-time
    useEffect(() => {
        const unsubscribe = liveClassService.subscribeToLiveClasses((liveList) => {
            setClasses(liveList);
            setIsLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Viewer count fluctuation effect
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveViewers((prev) => {
                const delta = Math.floor(Math.random() * 9) - 4;
                return Math.max(180, Math.min(380, prev + delta));
            });
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // Reminders toggle handler
    const handleToggleReminder = (classId: string, title: string) => {
        const isNowSet = !reminders[classId];
        const updated = { ...reminders, [classId]: isNowSet };
        setReminders(updated);
        try {
            localStorage.setItem('examinant_live_reminders', JSON.stringify(updated));
        } catch (e) {
            console.warn("Failed to persist reminder:", e);
        }

        if (isNowSet) {
            setToastMessage(`🔔 Reminder set for "${title}". We'll notify you 15m before class!`);
        } else {
            setToastMessage(`Reminder removed for "${title}".`);
        }

        setTimeout(() => {
            setToastMessage(null);
        }, 3500);
    };

    // Chat submit handler
    const handleSendChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const newMsg: LiveChatMessage = {
            id: Date.now().toString(),
            user: userName || 'You',
            avatarBg: 'bg-indigo-600',
            message: chatInput.trim(),
            time: 'Just now'
        };

        setChatMessages((prev) => [...prev, newMsg]);
        setChatInput('');
    };

    // Format start time helper
    const formatScheduledTime = (isoString?: string) => {
        if (!isoString) return 'Scheduled soon';
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return 'Scheduled soon';

            const today = new Date();
            const isToday = date.getDate() === today.getDate() &&
                            date.getMonth() === today.getMonth() &&
                            date.getFullYear() === today.getFullYear();

            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return isToday ? `Today at ${timeStr}` : `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
        } catch {
            return 'Scheduled soon';
        }
    };

    // Derived active live class (highest priority)
    const currentlyLiveClass = classes.find(c => c.status === 'live');
    const upcomingClasses = classes.filter(c => c.status === 'upcoming');
    const completedClasses = classes.filter(c => c.status === 'completed' || c.recordingUrl);

    // Filter classes based on active tab
    const getDisplayedClasses = () => {
        if (activeTab === 'live') {
            return classes.filter(c => c.status === 'live');
        }
        if (activeTab === 'upcoming') {
            return upcomingClasses;
        }
        if (activeTab === 'recordings') {
            return completedClasses;
        }
        return classes;
    };

    const displayedClasses = getDisplayedClasses();

    return (
        <div className="space-y-4 relative">
            {/* Toast Notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-5 right-5 z-50 bg-[#0B152B] border border-blue-500/40 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
                    >
                        <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-[#38BDF8] flex items-center justify-center shrink-0">
                            <Bell size={16} />
                        </div>
                        <span className="text-xs font-semibold text-slate-200">{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Section Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B152B] p-5 sm:p-6 border border-[#17274B] rounded-3xl shadow-xl">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                            <Radio size={22} className="animate-pulse" />
                        </div>
                        {currentlyLiveClass && (
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                            </span>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-black text-white tracking-tight">
                                Live Interactive Classroom
                            </h2>
                            {currentlyLiveClass ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    LIVE NOW
                                </span>
                            ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-[#38BDF8] border border-blue-500/30">
                                    {upcomingClasses.length} Scheduled
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">
                            Real-time lectures, live doubt clearing, and expert marathon sessions
                        </p>
                    </div>
                </div>

                {/* Filter Tabs & Quick Link */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="bg-[#070D1E] p-1 rounded-2xl border border-[#17274B] flex items-center gap-1">
                        {[
                            { id: 'all', label: 'All Classes' },
                            { id: 'live', label: '🔴 Live', count: currentlyLiveClass ? 1 : 0 },
                            { id: 'upcoming', label: 'Upcoming', count: upcomingClasses.length },
                            { id: 'recordings', label: 'Past Replays' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    activeTab === tab.id
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <span>{tab.label}</span>
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                        activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-[#38BDF8]'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => navigate('/dashboard/courses')}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#070D1E] hover:bg-[#10224A] text-[#38BDF8] hover:text-white border border-[#17274B] hover:border-blue-500/40 rounded-xl font-bold text-xs transition-all cursor-pointer"
                    >
                        <span>Full Timetable</span>
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* If there is an active LIVE CLASS, display the Featured Live Broadcast Card */}
            {currentlyLiveClass && (activeTab === 'all' || activeTab === 'live') && (
                <div className="relative overflow-hidden rounded-3xl border-2 border-rose-500/40 bg-gradient-to-br from-[#160B1E] via-[#0E152F] to-[#070D1E] p-6 sm:p-8 shadow-2xl shadow-rose-950/40">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                        {/* Live Info */}
                        <div className="space-y-3.5 max-w-2xl">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                    ● BROADCASTING LIVE NOW
                                </span>
                                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-[#38BDF8] border border-blue-500/30 text-xs font-bold uppercase tracking-wider">
                                    {currentlyLiveClass.subject || 'GENERAL'}
                                </span>
                                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                                    {currentlyLiveClass.examCategory || targetExam}
                                </span>
                                {currentlyLiveClass.batchName && (
                                    <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold tracking-wider flex items-center gap-1">
                                        🎓 {currentlyLiveClass.batchName}
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-bold backdrop-blur-md">
                                    <Users size={13} className="text-rose-400" />
                                    <span>{activeViewers} students in room</span>
                                </span>
                            </div>

                            <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                                {currentlyLiveClass.title}
                            </h3>

                            <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed font-medium">
                                {currentlyLiveClass.description || "Join the live interactive class for real-time problem solving, short tricks, and educator Q&A."}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 pt-1">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md border-2 border-white/20">
                                        {currentlyLiveClass.educatorName?.charAt(0) || 'E'}
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-white">{currentlyLiveClass.educatorName}</div>
                                        <div className="text-[10px] text-slate-400 font-semibold">Master Faculty • Live Session</div>
                                    </div>
                                </div>

                                <div className="h-4 w-px bg-white/10 hidden sm:block" />

                                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                                    <Clock size={15} />
                                    <span>Duration: ~{currentlyLiveClass.durationMinutes || 60} mins</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Join Button & Preview Thumbnail */}
                        <div className="relative group w-full lg:w-80 shrink-0">
                            <div className="relative h-44 rounded-2xl overflow-hidden border-2 border-rose-500/40 shadow-2xl bg-black">
                                <img
                                    src={currentlyLiveClass.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop"}
                                    alt={currentlyLiveClass.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                
                                <button
                                    onClick={() => setActiveStreamingClass(currentlyLiveClass)}
                                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-600/50 group-hover:scale-110 transition-transform cursor-pointer"
                                >
                                    <PlayCircle size={32} className="fill-white/20 ml-0.5" />
                                </button>

                                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-bold text-white">
                                    <span className="flex items-center gap-1 text-rose-400">
                                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                        Streaming Now
                                    </span>
                                    <span className="bg-black/70 px-2 py-0.5 rounded-md text-[10px]">
                                        Free Live Access
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => setActiveStreamingClass(currentlyLiveClass)}
                                className="w-full mt-3 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
                            >
                                <Radio size={16} className="animate-pulse" />
                                <span>Join Live Class Now</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid of Other Live / Upcoming Classes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedClasses.map((item) => {
                    const isLive = item.status === 'live';
                    const isUpcoming = item.status === 'upcoming';
                    const isCompleted = item.status === 'completed' || !!item.recordingUrl;
                    const hasReminder = !!reminders[item.id];

                    return (
                        <div
                            key={item.id}
                            className={`bg-[#0B152B] p-4 sm:p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between group hover:shadow-2xl ${
                                isLive
                                    ? 'border-rose-500/40 hover:border-rose-400'
                                    : 'border-[#17274B] hover:border-blue-500/40'
                            }`}
                        >
                            <div className="space-y-3">
                                {/* Thumbnail with overlays */}
                                <div className="relative h-36 rounded-2xl overflow-hidden bg-[#070D1E]">
                                    <img
                                        src={item.thumbnailUrl || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop"}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B152B] via-transparent to-transparent" />

                                    {/* Badges */}
                                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-sm ${
                                            isLive
                                                ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                                                : isUpcoming
                                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 backdrop-blur-md'
                                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 backdrop-blur-md'
                                        }`}>
                                            {isLive ? '● LIVE' : isUpcoming ? 'Upcoming' : 'Recorded'}
                                        </span>
                                        <span className="bg-[#070D1E]/80 backdrop-blur-md text-[#38BDF8] text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-blue-500/20">
                                            {item.subject}
                                        </span>
                                    </div>

                                    {/* Top right reminder button for upcoming */}
                                    {isUpcoming && (
                                        <button
                                            onClick={() => handleToggleReminder(item.id, item.title)}
                                            className={`absolute top-2.5 right-2.5 p-2 rounded-xl transition-all shadow-md cursor-pointer ${
                                                hasReminder
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white backdrop-blur-md'
                                            }`}
                                            title={hasReminder ? 'Reminder Active' : 'Set Class Reminder'}
                                        >
                                            {hasReminder ? <Check size={14} /> : <Bell size={14} />}
                                        </button>
                                    )}

                                    {/* Bottom timing info */}
                                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-bold text-slate-300">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} className="text-orange-400" />
                                            <span>{formatScheduledTime(item.scheduledStartTime)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} className="text-[#38BDF8]" />
                                            <span>{item.durationMinutes}m</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Title & Faculty */}
                                <div>
                                    {item.batchName && (
                                        <div className="mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold">
                                            <span>🎓 {item.batchName}</span>
                                        </div>
                                    )}
                                    <h4 className="font-black text-sm text-white line-clamp-2 leading-snug group-hover:text-[#38BDF8] transition-colors">
                                        {item.title}
                                    </h4>
                                    <div className="flex items-center justify-between mt-2 text-[11px] font-semibold text-slate-400">
                                        <span className="text-slate-300">By {item.educatorName}</span>
                                        <span className="text-xs font-bold text-orange-400">{item.examCategory}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="mt-4 pt-3 border-t border-[#17274B]">
                                {isLive ? (
                                    <button
                                        onClick={() => setActiveStreamingClass(item)}
                                        className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                                    >
                                        <PlayCircle size={15} />
                                        <span>Join Live Class</span>
                                    </button>
                                ) : isUpcoming ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleReminder(item.id, item.title)}
                                            className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                                hasReminder
                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                    : 'bg-[#070D1E] hover:bg-[#10224A] text-slate-300 hover:text-white border border-[#17274B]'
                                            }`}
                                        >
                                            {hasReminder ? <Check size={14} /> : <Bell size={14} />}
                                            <span>{hasReminder ? 'Reminder Set' : 'Remind Me'}</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveStreamingClass(item)}
                                            className="px-3 py-2.5 bg-[#070D1E] hover:bg-[#10224A] text-[#38BDF8] border border-[#17274B] rounded-xl font-bold text-xs cursor-pointer"
                                            title="View Details"
                                        >
                                            <BookOpen size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setActiveStreamingClass(item)}
                                        className="w-full py-2.5 bg-[#070D1E] hover:bg-blue-600 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-[#17274B] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                    >
                                        <PlayCircle size={15} className="text-[#38BDF8]" />
                                        <span>Watch Past Recording</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {displayedClasses.length === 0 && !isLoading && (
                <div className="bg-[#0B152B] p-8 rounded-3xl border border-[#17274B] text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-[#38BDF8] flex items-center justify-center mx-auto">
                        <Video size={24} />
                    </div>
                    <h4 className="text-sm font-black text-white">No classes in this filter</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Switch filters or visit the video classroom timetable to see all scheduled masterclasses.
                    </p>
                    <button
                        onClick={() => setActiveTab('all')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                        View All Classes
                    </button>
                </div>
            )}

            {/* ========================================================================= */}
            {/* LIVE STREAM CLASSROOM MODAL WITH REAL-TIME SIMULATED INTERACTIVE CHAT     */}
            {/* ========================================================================= */}
            <AnimatePresence>
                {activeStreamingClass && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0B152B] border border-[#1E3A75] w-full max-w-6xl max-h-[92vh] rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-4 sm:p-5 border-b border-[#17274B] bg-[#070D1E] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${
                                        activeStreamingClass.status === 'live' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-[#38BDF8]'
                                    }`}>
                                        <Radio size={18} className={activeStreamingClass.status === 'live' ? 'animate-pulse' : ''} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                activeStreamingClass.status === 'live' ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'
                                            }`}>
                                                {activeStreamingClass.status === 'live' ? '● LIVE' : 'Interactive Session'}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400">
                                                {activeStreamingClass.subject} • {activeStreamingClass.examCategory}
                                            </span>
                                        </div>
                                        <h3 className="text-sm sm:text-base font-black text-white line-clamp-1 mt-0.5">
                                            {activeStreamingClass.title}
                                        </h3>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setActiveStreamingClass(null)}
                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body: Player (Left) + Live Chat (Right) */}
                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
                                {/* Left: Video Stream Player + Class Details */}
                                <div className="lg:col-span-8 p-4 sm:p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-[#17274B] bg-[#070D1E]/60">
                                    <div className="rounded-2xl overflow-hidden border border-[#17274B] shadow-2xl bg-black aspect-video">
                                        <VideoPlayer
                                            videoUrl={activeStreamingClass.streamUrl || activeStreamingClass.recordingUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}
                                            thumbnailUrl={activeStreamingClass.thumbnailUrl}
                                            title={activeStreamingClass.title}
                                            autoPlay={true}
                                            className="w-full h-full"
                                        />
                                    </div>

                                    {/* Faculty & Session Summary */}
                                    <div className="bg-[#0B152B] p-4 sm:p-5 rounded-2xl border border-[#17274B] flex flex-col sm:flex-row justify-between gap-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                                                    {activeStreamingClass.educatorName?.charAt(0) || 'F'}
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black text-white">{activeStreamingClass.educatorName}</h4>
                                                    <p className="text-[10px] font-semibold text-[#38BDF8]">Examinant Master Faculty</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-300 pt-1 leading-relaxed">
                                                {activeStreamingClass.description || 'Welcome to this comprehensive interactive learning session.'}
                                            </p>
                                        </div>

                                        <div className="shrink-0 flex sm:flex-col justify-between sm:justify-center items-end gap-2 border-t sm:border-t-0 border-[#17274B] pt-2 sm:pt-0">
                                            <span className="text-[10px] font-bold text-slate-400">
                                                Active Audience: <strong className="text-rose-400">{activeViewers} students</strong>
                                            </span>
                                            <button
                                                onClick={() => navigate('/dashboard/community')}
                                                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#38BDF8] border border-blue-500/20 text-xs font-bold transition-all"
                                            >
                                                Ask Faculty Doubts
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Live Chat Simulator */}
                                <div className="lg:col-span-4 flex flex-col h-[400px] lg:h-auto bg-[#0B152B]">
                                    <div className="p-3.5 border-b border-[#17274B] bg-[#0E1B38] flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-white text-xs font-black">
                                            <MessageSquare size={14} className="text-[#38BDF8]" />
                                            <span>Live Student Discussion</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400 bg-black/40 px-2 py-0.5 rounded-full">
                                            Real-time
                                        </span>
                                    </div>

                                    {/* Chat Messages Log */}
                                    <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs">
                                        {chatMessages.map((msg) => (
                                            <div key={msg.id} className="space-y-0.5">
                                                <div className="flex items-center justify-between text-[10px]">
                                                    <span className={`font-black ${msg.isFaculty ? 'text-rose-400' : 'text-[#38BDF8]'}`}>
                                                        {msg.user}
                                                    </span>
                                                    <span className="text-slate-500">{msg.time}</span>
                                                </div>
                                                <div className={`p-2 rounded-xl text-slate-200 text-xs leading-relaxed ${
                                                    msg.isFaculty ? 'bg-rose-500/10 border border-rose-500/20 text-rose-200 font-semibold' : 'bg-[#070D1E] border border-[#17274B]'
                                                }`}>
                                                    {msg.message}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Chat Input Bar */}
                                    <form onSubmit={handleSendChat} className="p-3 border-t border-[#17274B] bg-[#070D1E] flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            placeholder="Ask a doubt or comment..."
                                            className="flex-1 bg-[#0B152B] border border-[#17274B] focus:border-[#38BDF8] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition-colors"
                                        />
                                        <button
                                            type="submit"
                                            className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-md cursor-pointer shrink-0"
                                        >
                                            <Send size={15} />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentLiveClassesSection;
