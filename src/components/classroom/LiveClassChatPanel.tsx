import React, { useState, useEffect, useRef } from 'react';
import { 
    Send, MessageSquare, X, Sparkles, Shield, User, 
    Smile, CornerDownLeft, Loader2, ThumbsUp, HelpCircle
} from 'lucide-react';
import { liveClassService } from '../../services/liveClassService';
import type { LiveClassChatMessage } from '../../types/liveClass.types';

interface LiveClassChatPanelProps {
    classId: string;
    currentUser: any;
    isInstructor: boolean;
    isOpen: boolean;
    onClose: () => void;
    className?: string;
}

const QUICK_PROMPTS = [
    "👍 Crystal clear Sir!",
    "🙋 Sir ek doubt hai",
    "🔥 Next question please",
    "📝 Note kar liya"
];

export const LiveClassChatPanel: React.FC<LiveClassChatPanelProps> = ({
    classId,
    currentUser,
    isInstructor,
    isOpen,
    onClose,
    className = ''
}) => {
    const [messages, setMessages] = useState<LiveClassChatMessage[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const [isSending, setIsSending] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Default moderator welcome message
    const defaultWelcome: LiveClassChatMessage = {
        id: 'welcome-1',
        classId,
        userId: 'system',
        userName: 'Examinant Moderator',
        isFaculty: true,
        message: 'Welcome to the live session! You can ask your doubts and discuss problems here in real-time.',
        time: 'Class start'
    };

    // Subscribe to Firestore live messages in real-time
    useEffect(() => {
        if (!classId) return;

        const unsubscribe = liveClassService.subscribeToClassMessages(classId, (list) => {
            setMessages(list);
        });

        return () => unsubscribe();
    }, [classId]);

    // Auto-scroll to latest message
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (textToSend?: string) => {
        const text = (textToSend || inputText).trim();
        if (!text || isSending || !classId) return;

        setIsSending(true);
        try {
            const userName = currentUser?.displayName || (isInstructor ? 'Sudhanshu Sir (Instructor)' : 'Student Aspirant');
            await liveClassService.sendClassMessage(classId, {
                userId: currentUser?.uid || `guest_${Date.now()}`,
                userName,
                userAvatar: currentUser?.photoURL || '',
                isFaculty: isInstructor,
                message: text
            });

            if (!textToSend) {
                setInputText('');
            }
        } catch (error) {
            console.error("Error sending live chat message:", error);
        } finally {
            setIsSending(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSendMessage();
    };

    if (!isOpen) return null;

    const displayMessages = messages.length > 0 ? messages : [defaultWelcome];

    return (
        <div className={`flex flex-col bg-[#0B152B] border-l border-[#17274B] h-full overflow-hidden shadow-2xl z-20 ${className}`}>
            {/* Header */}
            <div className="h-14 px-4 bg-[#0E1A35] border-b border-[#17274B] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <MessageSquare size={16} />
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                            <span>Live Discussion</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium">Realtime student & faculty chat</p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 bg-black/40 px-2 py-0.5 rounded-full border border-slate-700/60 mr-1">
                        {messages.length} msgs
                    </span>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Close Chat Panel"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 min-h-0 text-xs custom-scrollbar">
                {displayMessages.map((msg) => {
                    const isOwnMessage = currentUser?.uid && msg.userId === currentUser.uid;
                    const isFaculty = msg.isFaculty;

                    return (
                        <div 
                            key={msg.id}
                            className={`flex flex-col space-y-1 ${isOwnMessage && !isFaculty ? 'items-end' : 'items-start'}`}
                        >
                            {/* Sender Info Row */}
                            <div className="flex items-center gap-1.5 text-[10px] px-1">
                                {isFaculty ? (
                                    <span className="inline-flex items-center gap-1 font-black text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
                                        <Shield size={10} className="fill-amber-300 text-amber-300" />
                                        <span>Faculty</span>
                                    </span>
                                ) : isOwnMessage ? (
                                    <span className="font-bold text-blue-400">You</span>
                                ) : null}

                                <span className={`font-bold truncate max-w-[150px] ${isFaculty ? 'text-amber-200' : 'text-slate-300'}`}>
                                    {msg.userName}
                                </span>

                                <span className="text-slate-500 text-[9px] font-medium">
                                    {msg.time}
                                </span>
                            </div>

                            {/* Message Bubble */}
                            <div className={`p-2.5 rounded-2xl max-w-[90%] text-xs leading-relaxed break-words shadow-sm ${
                                isFaculty
                                    ? 'bg-gradient-to-r from-amber-950/50 to-rose-950/40 border border-amber-500/30 text-amber-100 font-medium'
                                    : isOwnMessage
                                    ? 'bg-blue-600 text-white font-medium rounded-tr-sm'
                                    : 'bg-[#102042] border border-[#1A2F5C] text-slate-200 rounded-tl-sm'
                            }`}>
                                {msg.message}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Reaction Chips */}
            <div className="px-3 py-2 bg-[#0E1A35]/60 border-t border-[#17274B] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(prompt)}
                        disabled={isSending}
                        className="px-2.5 py-1 bg-[#102042] hover:bg-blue-600/40 text-slate-300 hover:text-white border border-[#1E3668] rounded-full text-[10px] font-semibold transition-all whitespace-nowrap active:scale-95 shrink-0"
                    >
                        {prompt}
                    </button>
                ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleFormSubmit} className="p-3 bg-[#0E1A35] border-t border-[#17274B] shrink-0 flex items-center gap-2">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isInstructor ? "Write announcement or reply..." : "Ask a doubt or write a message..."}
                    maxLength={300}
                    disabled={isSending}
                    className="flex-1 px-3.5 py-2.5 bg-[#070D1E] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                    type="submit"
                    disabled={isSending || !inputText.trim()}
                    className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/25 transition-all shrink-0 active:scale-95"
                    title="Send Message"
                >
                    {isSending ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Send size={16} />
                    )}
                </button>
            </form>
        </div>
    );
};

export default LiveClassChatPanel;
