import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Radio, PlayCircle, Award, CheckCircle2, Clock, Sparkles, 
    ArrowRight, Loader2, Video, Calendar, User, Bell, ChevronRight, 
    BookOpen, Send, MessageSquare, Maximize2, X, Eye, HelpCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { entitlementService } from '../../services/entitlementService';
import { liveClassService } from '../../services/liveClassService';
import type { CourseEnrollment } from '../../types/course.types';
import type { LiveClass } from '../../types/liveClass.types';
import VideoPlayer from '../../components/common/VideoPlayer';

interface LiveChatMessage {
    id: string;
    userName: string;
    text: string;
    time: string;
    isTeacher?: boolean;
}

const StudentCoursesPage = () => {
    const navigate = useNavigate();
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;
    const profileData = authContext?.profileData;

    const [activeTab, setActiveTab] = useState<'live' | 'recorded'>('live');
    const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
    const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState<boolean>(true);
    const [isLoadingLive, setIsLoadingLive] = useState<boolean>(true);

    // Live Player Modal State
    const [activeStreamingClass, setActiveStreamingClass] = useState<LiveClass | null>(null);
    const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([
        { id: '1', userName: 'Examinant Moderator', text: 'Welcome students! Keep your notebooks ready.', time: 'Just now', isTeacher: true },
        { id: '2', userName: 'Rahul K.', text: 'Sir is there any shortcut for 3-digit multiplication?', time: '1m ago' },
        { id: '3', userName: 'Pooja Verma', text: 'Audio and video are crystal clear!', time: 'Just now' }
    ]);
    const [chatInput, setChatInput] = useState<string>('');
    const [reminders, setReminders] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (currentUser) loadStudentBatches();

        // Subscribe in real-time to Live Classes from Firestore
        const unsubscribeLive = liveClassService.subscribeToLiveClasses((classes) => {
            setLiveClasses(classes);
            setIsLoadingLive(false);
        });

        return () => {
            unsubscribeLive();
        };
    }, [currentUser]);

    const loadStudentBatches = async () => {
        setIsLoadingBatches(true);
        try {
            if (!currentUser) return;
            const list = await entitlementService.getStudentEnrollments(currentUser.uid);
            setEnrollments(list);
        } catch (error) {
            console.error("Error loading student batches:", error);
        } finally {
            setIsLoadingBatches(false);
        }
    };

    const handleSendChatMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const newMsg: LiveChatMessage = {
            id: Date.now().toString(),
            userName: profileData?.fullName || currentUser?.displayName || 'Student',
            text: chatInput.trim(),
            time: 'Just now'
        };

        setChatMessages(prev => [...prev, newMsg]);
        setChatInput('');
    };

    const handleToggleReminder = (classId: string, title: string) => {
        const nextState = !reminders[classId];
        setReminders(prev => ({ ...prev, [classId]: nextState }));
        if (nextState) {
            alert(`🔔 Reminder enabled for "${title}". You will receive a notification before the class begins!`);
        } else {
            alert(`Reminder turned off for "${title}".`);
        }
    };

    // Helper for YouTube embed link extraction
    const getEmbedStreamUrl = (url: string) => {
        if (!url) return '';
        if (url.includes('youtube.com/embed/')) return url;
        if (url.includes('youtube.com/watch?v=')) {
            const videoId = url.split('v=')[1]?.split('&')[0];
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&live=1`;
        }
        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1]?.split('?')[0];
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&live=1`;
        }
        return url;
    };

    // Grouping live classes by status
    const currentLiveClass = liveClasses.find(c => c.status === 'live');
    const upcomingClasses = liveClasses.filter(c => c.status === 'upcoming');
    const completedClasses = liveClasses.filter(c => c.status === 'completed');

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Top Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <Sparkles size={18} className="fill-blue-600" />
                        <span className="text-xs font-black uppercase tracking-widest">Digital Learning Hub</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Video Classroom</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Join live interactive classes and stream recorded batch lectures anytime.</p>
                </div>
                <button
                    onClick={() => navigate('/courses')}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white font-bold text-sm px-6 py-3.5 rounded-2xl transition-all shadow-md"
                >
                    <BookOpen size={18} />
                    <span>Browse All Batches</span>
                </button>
            </div>

            {/* Navigation Tabs (Live Classroom vs Recorded Classroom) */}
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm max-w-md">
                <button
                    onClick={() => setActiveTab('live')}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl font-extrabold text-sm transition-all duration-200 ${
                        activeTab === 'live'
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    <span className="relative flex h-2.5 w-2.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeTab === 'live' ? 'bg-white' : 'bg-rose-500'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${activeTab === 'live' ? 'bg-white' : 'bg-rose-600'}`}></span>
                    </span>
                    <span>Live Classroom</span>
                </button>

                <button
                    onClick={() => setActiveTab('recorded')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-extrabold text-sm transition-all duration-200 ${
                        activeTab === 'recorded'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    <PlayCircle size={18} />
                    <span>Recorded Classroom</span>
                </button>
            </div>

            {/* TAB 1: LIVE CLASSROOM */}
            {activeTab === 'live' && (
                <div className="space-y-8">
                    {/* Active Live Hero Banner */}
                    {isLoadingLive ? (
                        <div className="flex justify-center py-16 bg-white rounded-3xl border border-slate-100">
                            <Loader2 className="animate-spin text-rose-600" size={36} />
                        </div>
                    ) : currentLiveClass ? (
                        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-2xl border border-rose-500/25">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="relative z-10 max-w-3xl space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="inline-flex items-center gap-2 bg-rose-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider animate-pulse shadow-lg">
                                        <Radio size={14} />
                                        <span>Happening Live Now</span>
                                    </span>
                                    <span className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                                        {currentLiveClass.examCategory} • {currentLiveClass.subject}
                                    </span>
                                </div>
                                <h2 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight">
                                    {currentLiveClass.title}
                                </h2>
                                <p className="text-slate-300 text-sm sm:text-base font-medium leading-relaxed">
                                    {currentLiveClass.description || `Join ${currentLiveClass.educatorName} live for real-time problem solving, doubts discussion, and key tips.`}
                                </p>
                                <div className="flex flex-wrap items-center gap-4 pt-2">
                                    <button
                                        onClick={() => setActiveStreamingClass(currentLiveClass)}
                                        className="px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-rose-600/30 flex items-center gap-2.5 hover:-translate-y-0.5 transition-all"
                                    >
                                        <Radio size={18} className="animate-pulse" />
                                        <span>Join Live Stream</span>
                                    </button>
                                    <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-200 bg-white/10 backdrop-blur-md px-4 py-3.5 rounded-2xl border border-white/10">
                                        <Eye size={14} className="text-rose-400" />
                                        <span>{currentLiveClass.activeViewers || 248} Students Watching</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="space-y-2 text-center sm:text-left">
                                <span className="inline-flex items-center gap-2 text-blue-400 text-xs font-black uppercase tracking-wider">
                                    <Clock size={14} /> No Active Live Broadcast
                                </span>
                                <h3 className="text-xl sm:text-2xl font-black">All Live Classes are Currently on Schedule</h3>
                                <p className="text-slate-400 text-xs sm:text-sm font-medium">Check the upcoming schedule below and set reminders to get notified when faculty goes live.</p>
                            </div>
                            {upcomingClasses.length > 0 && (
                                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center shrink-0">
                                    <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block">Next Session</span>
                                    <span className="text-sm font-black text-rose-400 mt-1 block">
                                        {new Date(upcomingClasses[0].scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Upcoming Live Classes Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-extrabold text-slate-900">Upcoming Live Sessions ({upcomingClasses.length})</h3>
                                <p className="text-xs text-slate-500 font-medium">Schedule your learning calendar for upcoming expert lectures.</p>
                            </div>
                        </div>

                        {upcomingClasses.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 text-slate-500 font-bold text-sm">
                                No upcoming live sessions scheduled at the moment. Please check back later!
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {upcomingClasses.map(session => (
                                    <div key={session.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                        <div className="relative h-44 bg-slate-900 overflow-hidden">
                                            {session.thumbnailUrl ? (
                                                <img src={session.thumbnailUrl} alt={session.title} className="w-full h-full object-cover opacity-80" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950 text-white font-black text-lg">
                                                    {session.examCategory} Live
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3">
                                                <span className="bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 border border-white/10">
                                                    <Calendar size={12} /> {new Date(session.scheduledStartTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                                                {session.durationMinutes} Mins
                                            </div>
                                        </div>

                                        <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                                                    <span>{session.subject}</span>
                                                    <span>•</span>
                                                    <span className="text-slate-400">{session.examCategory}</span>
                                                </div>
                                                <h4 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-2">
                                                    {session.title}
                                                </h4>
                                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 pt-1">
                                                    <User size={14} className="text-slate-400" />
                                                    <span>{session.educatorName}</span>
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-slate-100">
                                                <button
                                                    onClick={() => handleToggleReminder(session.id, session.title)}
                                                    className={`w-full py-3 font-extrabold text-xs rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                                                        reminders[session.id]
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                                    }`}
                                                >
                                                    <Bell size={14} className={reminders[session.id] ? 'fill-emerald-600' : ''} />
                                                    <span>{reminders[session.id] ? 'Reminder Set' : 'Set Reminder'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Past Live Recordings */}
                    {completedClasses.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-slate-200">
                            <div>
                                <h3 className="text-xl font-extrabold text-slate-900">Past Live Class Replays ({completedClasses.length})</h3>
                                <p className="text-xs text-slate-500 font-medium">Missed a live session? Watch complete replays anytime.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {completedClasses.map(session => (
                                    <div key={session.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all">
                                        <div className="relative h-40 bg-slate-900 overflow-hidden">
                                            {session.thumbnailUrl ? (
                                                <img src={session.thumbnailUrl} alt={session.title} className="w-full h-full object-cover opacity-75" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white font-black text-base">
                                                    {session.examCategory} Replay
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3">
                                                <span className="bg-slate-800 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md">
                                                    Replay Available
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-5 space-y-3">
                                            <h4 className="text-sm font-extrabold text-slate-900 line-clamp-2">{session.title}</h4>
                                            <p className="text-xs text-slate-400 font-medium">{session.educatorName} • {session.subject}</p>
                                            <button
                                                onClick={() => setActiveStreamingClass(session)}
                                                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                                            >
                                                <PlayCircle size={16} />
                                                <span>Watch Replay</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: RECORDED CLASSROOM */}
            {activeTab === 'recorded' && (
                <div className="space-y-6">
                    {isLoadingBatches ? (
                        <div className="flex justify-center py-20 bg-white rounded-3xl border border-slate-100">
                            <Loader2 className="animate-spin text-blue-600" size={40} />
                        </div>
                    ) : enrollments.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 space-y-4">
                            <Video size={48} className="mx-auto text-slate-300" />
                            <h3 className="text-xl font-extrabold text-slate-800">You haven't enrolled in any recorded batches yet.</h3>
                            <p className="text-slate-500 text-sm max-w-md mx-auto">Explore expert recorded video batches and start building your exam preparation today.</p>
                            <button
                                onClick={() => navigate('/courses')}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-500/25 transition-all"
                            >
                                Explore Batches Catalog
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {enrollments.map(item => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
                                >
                                    <div className="p-6 space-y-4">
                                        {item.thumbnailUrl && (
                                            <div className="w-full h-40 rounded-2xl overflow-hidden bg-slate-900 relative">
                                                <img src={item.thumbnailUrl} alt={item.courseTitle} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                                                {item.status === 'completed' ? 'Completed' : 'In Progress'}
                                            </span>
                                            <h3 className="text-lg font-extrabold text-slate-900 leading-snug line-clamp-2 pt-1">{item.courseTitle}</h3>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-1.5 pt-2">
                                            <div className="flex justify-between items-center text-xs font-bold">
                                                <span className="text-slate-500">Overall Progress</span>
                                                <span className="text-blue-600 font-extrabold">{item.progressPercent || 0}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${item.progressPercent || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 pt-0 border-t border-slate-100/80 bg-slate-50/50">
                                        <button
                                            onClick={() => navigate(`/dashboard/courses/${item.courseId}/learn`)}
                                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all mt-4"
                                        >
                                            <PlayCircle size={18} />
                                            <span>{item.progressPercent >= 100 ? 'Review Batch' : 'Continue Learning'}</span>
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* LIVE STREAM CINEMA PLAYER MODAL */}
            {activeStreamingClass && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                        {/* Stream Header */}
                        <div className="p-4 sm:px-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3 truncate">
                                {activeStreamingClass.status === 'live' ? (
                                    <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse shrink-0">
                                        <Radio size={12} /> Live
                                    </span>
                                ) : (
                                    <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shrink-0">
                                        Replay
                                    </span>
                                )}
                                <h3 className="text-white font-bold text-sm sm:text-base truncate">
                                    {activeStreamingClass.title}
                                </h3>
                            </div>
                            <button
                                onClick={() => setActiveStreamingClass(null)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Stream Body: Video Player + Live Chat */}
                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* Video Stream Stage */}
                            <div className="flex-1 bg-black flex flex-col justify-center relative overflow-hidden">
                                {activeStreamingClass.streamUrl.includes('youtube') || activeStreamingClass.streamUrl.includes('youtu.be') ? (
                                    <iframe
                                        src={getEmbedStreamUrl(activeStreamingClass.streamUrl)}
                                        title={activeStreamingClass.title}
                                        className="w-full h-full border-0 aspect-video"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                ) : (
                                    <VideoPlayer
                                        videoUrl={activeStreamingClass.streamUrl}
                                        thumbnailUrl={activeStreamingClass.thumbnailUrl}
                                        title={activeStreamingClass.title}
                                    />
                                )}
                            </div>

                            {/* Live Chat & Doubts Panel */}
                            <div className="w-full lg:w-80 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between shrink-0 h-64 lg:h-auto">
                                <div className="p-3 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
                                    <span className="flex items-center gap-1.5">
                                        <MessageSquare size={14} className="text-rose-500" />
                                        <span>Live Chat & Doubts</span>
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-semibold">Real-time</span>
                                </div>

                                {/* Chat Messages Container */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
                                    {chatMessages.map(msg => (
                                        <div key={msg.id} className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-extrabold ${msg.isTeacher ? 'text-rose-400' : 'text-blue-400'}`}>
                                                    {msg.userName}
                                                </span>
                                                <span className="text-[10px] text-slate-600">{msg.time}</span>
                                            </div>
                                            <p className="text-slate-300 font-medium leading-snug">{msg.text}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Chat Input Bar */}
                                <form onSubmit={handleSendChatMessage} className="p-2 border-t border-slate-800 flex gap-2 bg-slate-900/50">
                                    <input
                                        type="text"
                                        placeholder="Ask a doubt or comment..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-rose-500"
                                    />
                                    <button
                                        type="submit"
                                        className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors shrink-0"
                                    >
                                        <Send size={14} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentCoursesPage;
