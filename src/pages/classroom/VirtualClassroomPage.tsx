import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, Radio, Users, Clock, ShieldCheck, CheckCircle2, 
    Play, AlertCircle, Share2, PhoneOff, MicOff, ExternalLink, 
    Upload, Sparkles, Check, RefreshCw, Video, BookOpen, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { liveClassService } from '../../services/liveClassService';
import type { LiveClass, JitsiTokenResponse } from '../../types/liveClass.types';
import JitsiPlayer, { type JitsiPlayerRef } from '../../components/classroom/JitsiPlayer';
import LiveClassChatPanel from '../../components/classroom/LiveClassChatPanel';

export default function VirtualClassroomPage() {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();
    const auth = useAuth();
    const currentUser = auth?.currentUser;
    const userRole = auth?.userRole;
    const isInstructor = userRole === 'admin';

    const playerRef = useRef<JitsiPlayerRef>(null);

    // Live session state
    const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [roomTokenConfig, setRoomTokenConfig] = useState<JitsiTokenResponse | null>(null);
    const [isStartingClass, setIsStartingClass] = useState<boolean>(false);
    const [isEndingClass, setIsEndingClass] = useState<boolean>(false);
    
    // Live elapsed timer
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

    // Replay & recording states (State 4)
    const [replayInputUrl, setReplayInputUrl] = useState<string>('');
    const [isSavingReplay, setIsSavingReplay] = useState<boolean>(false);
    const [replayWatchProgress, setReplayWatchProgress] = useState<number>(0);
    const [isReplayCompleted, setIsReplayCompleted] = useState<boolean>(false);
    const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // 1. Subscribe to Live Class Document in Firestore Realtime
    useEffect(() => {
        if (!classId) return;
        setIsLoading(true);

        const unsubscribe = liveClassService.subscribeToSingleClass(classId, (cls) => {
            if (cls) {
                setLiveClass(cls);
                if (cls.recordingUrl) {
                    setReplayInputUrl(cls.recordingUrl);
                }
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [classId]);

    // 2. Fetch JWT Token when Class is Live or when Instructor is ready to start
    useEffect(() => {
        if (!liveClass || !classId) return;

        // If class is live or instructor is preparing
        if (liveClass.status === 'live' || isInstructor) {
            liveClassService.fetchLiveToken({
                classId,
                roomId: liveClass.roomName,
                userId: currentUser?.uid,
                userName: currentUser?.displayName || (isInstructor ? 'Instructor' : 'Student'),
                userEmail: currentUser?.email || '',
                userAvatar: currentUser?.photoURL || '',
                isInstructor
            }).then(config => {
                setRoomTokenConfig(config);
            }).catch(err => {
                console.error("Failed to fetch live classroom token:", err);
            });
        }
    }, [liveClass?.status, classId, isInstructor, currentUser]);

    // 3. Elapsed Timer calculation for State 3 (Live)
    useEffect(() => {
        if (liveClass?.status !== 'live') {
            setElapsedSeconds(0);
            return;
        }

        const startTimestamp = liveClass.startedAt 
            ? new Date(liveClass.startedAt).getTime() 
            : Date.now();

        const updateTimer = () => {
            const now = Date.now();
            const diffSec = Math.max(0, Math.floor((now - startTimestamp) / 1000));
            setElapsedSeconds(diffSec);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [liveClass?.status, liveClass?.startedAt]);

    const formatTimer = (totalSeconds: number) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        if (hrs > 0) {
            return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // --- State Transitions ---

    // Instructor starts class (State 2 -> State 3)
    const handleStartClassNow = async () => {
        if (!classId) return;
        setIsStartingClass(true);
        try {
            await liveClassService.startLiveClass(classId);
            showToast("Class is now LIVE! Room initialized.");
        } catch (error) {
            console.error("Error starting live class:", error);
            showToast("Failed to start live session.");
        } finally {
            setIsStartingClass(false);
        }
    };

    // Instructor ends class for everyone (State 3 -> State 4)
    const handleEndConferenceForAll = async () => {
        if (!classId) return;
        if (!window.confirm("Are you sure you want to End this Live Class for ALL participants?")) return;
        
        setIsEndingClass(true);
        try {
            // Force terminate conference in Jitsi API
            if (playerRef.current) {
                playerRef.current.endConference();
            }
            await liveClassService.endLiveClass(classId);
            showToast("Class ended successfully. You can now attach replay recording.");
        } catch (error) {
            console.error("Error ending live class:", error);
            showToast("Failed to end class.");
        } finally {
            setIsEndingClass(false);
        }
    };

    // Instructor or Student leaves locally
    const handleLeaveRoomLocally = () => {
        if (playerRef.current) {
            playerRef.current.hangup();
        }
        navigate(isInstructor ? '/admin-dashboard/live-classes' : '/dashboard/courses');
    };

    // Instructor attaches/saves replay recording URL (State 4)
    const handleSaveReplayRecording = async () => {
        if (!classId || !replayInputUrl.trim()) return;
        setIsSavingReplay(true);
        try {
            await liveClassService.saveClassRecording(classId, replayInputUrl.trim());
            showToast("Recording replay link updated successfully!");
        } catch (error) {
            console.error("Error saving recording replay:", error);
            showToast("Failed to save recording.");
        } finally {
            setIsSavingReplay(false);
        }
    };

    // Replay progress watcher (>90% marks completed)
    const handleReplayProgress = (percent: number) => {
        setReplayWatchProgress(percent);
        if (percent >= 90 && !isReplayCompleted) {
            setIsReplayCompleted(true);
            showToast("Lesson completed! You've watched over 90% of the replay.");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#070D1E] flex flex-col items-center justify-center text-white">
                <RefreshCw className="w-10 h-10 animate-spin text-blue-500 mb-3" />
                <p className="text-sm font-semibold tracking-wide text-slate-300">Loading virtual classroom...</p>
            </div>
        );
    }

    // STATE 1: NOT SCHEDULED
    if (!liveClass) {
        return (
            <div className="min-h-screen bg-[#070D1E] flex flex-col items-center justify-center p-6 text-center text-white">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
                    <AlertCircle size={32} />
                </div>
                <h2 className="text-2xl font-black tracking-tight mb-2">Classroom Not Scheduled</h2>
                <p className="text-sm text-slate-400 max-w-md mb-6">
                    This live session is either not scheduled or has been removed. Check back later or view upcoming batches.
                </p>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all"
                >
                    <ChevronLeft size={18} />
                    <span>Back to Dashboard</span>
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen h-[100dvh] max-h-screen bg-[#070D1E] text-slate-100 flex flex-col overflow-hidden">
            {/* Top Navigation & Status Bar */}
            <header className="h-14 sm:h-16 px-3 sm:px-6 bg-[#0B152B] border-b border-[#17274B] flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(isInstructor ? '/admin-dashboard/live-classes' : '/dashboard/courses')}
                        className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Back"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                {liveClass.subject || 'Live Class'}
                            </span>
                            {liveClass.batchName && (
                                <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">
                                    🎓 {liveClass.batchName}
                                </span>
                            )}
                        </div>
                        <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md md:max-w-xl">
                            {liveClass.title}
                        </h1>
                    </div>
                </div>

                {/* Right Header Status Indicators & Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {liveClass.status === 'live' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-wider text-rose-400">LIVE</span>
                            <span className="text-xs font-mono font-bold text-white pl-1 border-l border-rose-500/30">
                                {formatTimer(elapsedSeconds)}
                            </span>
                        </div>
                    )}

                    {liveClass.status === 'upcoming' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
                            <Clock size={14} className="text-amber-400" />
                            <span className="text-xs font-bold text-amber-300">Scheduled</span>
                        </div>
                    )}

                    {liveClass.status === 'completed' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                            <CheckCircle2 size={14} className="text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-300">Completed</span>
                        </div>
                    )}

                    {/* Role Badge */}
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 border border-slate-700">
                        <ShieldCheck size={14} className={isInstructor ? "text-blue-400" : "text-emerald-400"} />
                        <span>{isInstructor ? "Instructor Mode" : "Student Attendee"}</span>
                    </div>

                    {/* Live Discussion Chat Toggle */}
                    {liveClass.status === 'live' && (
                        <button
                            onClick={() => setIsChatOpen(!isChatOpen)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                isChatOpen 
                                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300' 
                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                            }`}
                            title="Toggle Student Live Chat"
                        >
                            <MessageSquare size={14} className={isChatOpen ? "text-blue-400" : "text-slate-400"} />
                            <span className="hidden sm:inline">Live Chat</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </button>
                    )}

                    {/* Live Conference Actions */}
                    {liveClass.status === 'live' && (
                        <div className="flex items-center gap-2">
                            {isInstructor ? (
                                <>
                                    <button
                                        onClick={() => playerRef.current?.muteEveryone()}
                                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-slate-200 border border-slate-700 transition-colors"
                                        title="Mute All Attendees"
                                    >
                                        <MicOff size={14} />
                                        <span>Mute All</span>
                                    </button>
                                    <button
                                        onClick={handleEndConferenceForAll}
                                        disabled={isEndingClass}
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-xs font-black rounded-xl text-white shadow-lg shadow-rose-600/25 transition-all"
                                    >
                                        <PhoneOff size={14} />
                                        <span>End for All</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleLeaveRoomLocally}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-200 hover:text-rose-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
                                >
                                    <PhoneOff size={14} />
                                    <span>Leave Class</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* Main Classroom Body */}
            <main className="flex-1 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] p-1.5 sm:p-3 flex flex-col overflow-hidden min-h-0">
                
                {/* ---------------- STATE 2: SCHEDULED ---------------- */}
                {liveClass.status === 'upcoming' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto w-full overflow-y-auto">
                        <div className="w-20 h-20 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 shadow-xl shadow-blue-500/10">
                            <Radio size={36} className="animate-pulse" />
                        </div>
                        
                        <span className="text-xs font-black uppercase tracking-widest text-blue-400 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-3">
                            Classroom Ready & Secured
                        </span>
                        
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                            {liveClass.title}
                        </h2>

                        <p className="text-slate-400 text-sm max-w-lg mb-6">
                            {liveClass.description || "Interactive virtual live session with high-definition audio, video, screen share and doubts moderation."}
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md bg-[#0B152B] p-4 rounded-2xl border border-[#17274B] mb-8 text-left">
                            <div>
                                <span className="text-[11px] text-slate-400 font-medium block">Educator</span>
                                <span className="text-sm font-bold text-white truncate block">{liveClass.educatorName}</span>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-400 font-medium block">Duration</span>
                                <span className="text-sm font-bold text-white">{liveClass.durationMinutes} Mins</span>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <span className="text-[11px] text-slate-400 font-medium block">Category</span>
                                <span className="text-sm font-bold text-white">{liveClass.examCategory}</span>
                            </div>
                        </div>

                        {/* Instructor View: Launch Button */}
                        {isInstructor ? (
                            <div className="space-y-3 w-full max-w-md">
                                <button
                                    onClick={handleStartClassNow}
                                    disabled={isStartingClass}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-base rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all"
                                >
                                    <Play size={20} className="fill-white" />
                                    <span>{isStartingClass ? "Initializing Room..." : "Start Class Now (Host)"}</span>
                                </button>
                                <p className="text-xs text-slate-500">
                                    Clicking start will open the live virtual room and alert all enrolled students.
                                </p>
                            </div>
                        ) : (
                            /* Student View: Waiting for Instructor State */
                            <div className="space-y-4 w-full max-w-md bg-[#0B152B]/80 border border-[#17274B] p-6 rounded-2xl">
                                <div className="flex items-center justify-center gap-2 text-amber-400">
                                    <Clock size={18} className="animate-spin" />
                                    <span className="text-sm font-bold">Waiting for Instructor to start class...</span>
                                </div>
                                <p className="text-xs text-slate-400">
                                    Please stay on this page. As soon as {liveClass.educatorName} starts the broadcast, you will automatically enter the live room without needing to refresh.
                                </p>
                                <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-400 font-medium">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                    <span>Realtime synchronization connected</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ---------------- STATE 3: LIVE CLASSROOM ---------------- */}
                {liveClass.status === 'live' && (
                    <div className="flex-1 w-full h-full min-h-0 flex overflow-hidden gap-2">
                        {/* Video Section */}
                        <div className="flex-1 w-full h-full min-h-0 flex flex-col overflow-hidden">
                            {liveClass.streamProvider === 'youtube' && liveClass.streamUrl ? (
                                <div className="w-full h-full flex-1 rounded-2xl overflow-hidden bg-black border border-slate-800 flex flex-col">
                                    <iframe 
                                        src={liveClass.streamUrl.replace('watch?v=', 'embed/')} 
                                        title={liveClass.title}
                                        className="w-full h-full flex-1 border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    />
                                </div>
                            ) : (
                                /* Core Enterprise Jitsi Player */
                                roomTokenConfig ? (
                                    <JitsiPlayer
                                        ref={playerRef}
                                        roomConfig={roomTokenConfig}
                                        user={{
                                            id: currentUser?.uid,
                                            name: currentUser?.displayName || (isInstructor ? 'Instructor' : 'Student'),
                                            email: currentUser?.email || '',
                                            avatar: currentUser?.photoURL || ''
                                        }}
                                        isInstructor={isInstructor}
                                        onReadyToClose={handleLeaveRoomLocally}
                                        onEndConference={() => {
                                            showToast("The host has ended this live class.");
                                        }}
                                        className="w-full h-full flex-1 min-h-0"
                                    />
                                ) : (
                                    <div className="flex-1 w-full h-full min-h-0 flex flex-col items-center justify-center bg-[#0B152B] rounded-2xl border border-[#17274B] text-center p-6">
                                        <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                                        <p className="text-sm font-bold text-white">Negotiating encryption keys...</p>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Real-time Student & Faculty Live Chat Panel (Desktop) */}
                        {classId && isChatOpen && (
                            <div className="w-80 xl:w-96 shrink-0 h-full rounded-2xl overflow-hidden border border-slate-800 hidden md:flex">
                                <LiveClassChatPanel
                                    classId={classId}
                                    currentUser={currentUser}
                                    isInstructor={isInstructor}
                                    isOpen={isChatOpen}
                                    onClose={() => setIsChatOpen(false)}
                                    className="w-full h-full"
                                />
                            </div>
                        )}

                        {/* Mobile Drawer Floating Overlay */}
                        {classId && isChatOpen && (
                            <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-80 bg-black/60 backdrop-blur-sm md:hidden flex justify-end">
                                <LiveClassChatPanel
                                    classId={classId}
                                    currentUser={currentUser}
                                    isInstructor={isInstructor}
                                    isOpen={isChatOpen}
                                    onClose={() => setIsChatOpen(false)}
                                    className="w-full sm:w-80 h-full"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* ---------------- STATE 4: COMPLETED & REPLAY RECORDING ---------------- */}
                {liveClass.status === 'completed' && (
                    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full space-y-6 py-6">
                        <div className="bg-[#0B152B] border border-[#17274B] p-6 rounded-3xl shadow-sm">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#17274B]">
                                <div>
                                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                        <CheckCircle2 size={18} />
                                        <span className="text-xs font-black uppercase tracking-wider">Session Concluded</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-white">{liveClass.title}</h2>
                                    <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                                        Educator: {liveClass.educatorName} | Category: {liveClass.examCategory}
                                    </p>
                                </div>

                                {isReplayCompleted && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                                        <Check size={14} />
                                        <span>Lesson Completed</span>
                                    </div>
                                )}
                            </div>

                            {/* Replay Video Player */}
                            <div className="mt-6">
                                {liveClass.recordingUrl ? (
                                    <div className="space-y-4">
                                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
                                            {liveClass.recordingUrl.includes('youtube') || liveClass.recordingUrl.includes('youtu.be') ? (
                                                <iframe
                                                    src={liveClass.recordingUrl.replace('watch?v=', 'embed/')}
                                                    title="Lecture Replay"
                                                    className="w-full h-full border-0"
                                                    allowFullScreen
                                                    allow="autoplay; encrypted-media"
                                                />
                                            ) : (
                                                <video
                                                    src={liveClass.recordingUrl}
                                                    controls
                                                    className="w-full h-full"
                                                    onTimeUpdate={(e) => {
                                                        const vid = e.currentTarget;
                                                        if (vid.duration > 0) {
                                                            const pct = (vid.currentTime / vid.duration) * 100;
                                                            handleReplayProgress(pct);
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>

                                        {/* Progress Bar for Lesson Completion tracking (>90%) */}
                                        {!isInstructor && (
                                            <div className="bg-[#070D1E] p-4 rounded-2xl border border-[#17274B]">
                                                <div className="flex justify-between items-center text-xs font-bold mb-2">
                                                    <span className="text-slate-300">Replay Completion Progress</span>
                                                    <span className="text-blue-400">{Math.round(replayWatchProgress)}%</span>
                                                </div>
                                                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                                                    <div 
                                                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                                        style={{ width: `${Math.min(100, replayWatchProgress)}%` }}
                                                    />
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-2">
                                                    Watch at least 90% of the replay to automatically mark this lesson as completed in your batch syllabus.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-10 text-center rounded-2xl bg-[#070D1E] border border-[#17274B]">
                                        <Video size={40} className="mx-auto text-slate-500 mb-3" />
                                        <h4 className="text-base font-bold text-white mb-1">Replay Recording Processing</h4>
                                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                            The live session has ended. The instructor is uploading or processing the high-definition class recording.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Instructor Controls: Upload or Link Replay Recording */}
                            {isInstructor && (
                                <div className="mt-8 pt-6 border-t border-[#17274B]">
                                    <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Upload size={16} className="text-blue-400" />
                                        <span>Instructor Post-Class Replay Management</span>
                                    </h4>
                                    <p className="text-xs text-slate-400 mb-4">
                                        Attach a direct AWS S3 video URL, Cloudinary mp4 link, or YouTube replay link for students.
                                    </p>
                                    
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input
                                            type="url"
                                            placeholder="Paste recording URL (e.g. https://s3.amazonaws.com/... or https://youtu.be/...)"
                                            value={replayInputUrl}
                                            onChange={(e) => setReplayInputUrl(e.target.value)}
                                            className="flex-1 px-4 py-3 bg-[#070D1E] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                        />
                                        <button
                                            onClick={handleSaveReplayRecording}
                                            disabled={isSavingReplay || !replayInputUrl.trim()}
                                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shrink-0"
                                        >
                                            {isSavingReplay ? "Saving..." : "Save Recording"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </main>

            {/* Global Toast */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold shadow-2xl animate-fade-in flex items-center gap-2">
                    <Sparkles size={16} />
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}
