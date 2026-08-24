import React, { useState } from 'react';
import { Play, Video, Clock, Sparkles } from 'lucide-react';

interface VideoPlayerProps {
    videoUrl: string;
    thumbnailUrl?: string;
    title?: string;
    durationMinutes?: number;
    autoPlay?: boolean;
    className?: string;
}

/**
 * Extracts YouTube Video ID if present in URL
 */
const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
};

/**
 * Format video URL for iframe or native video tag
 */
const formatVideoSource = (url: string, autoPlay: boolean = false) => {
    if (!url) return { isIframe: false, embedUrl: '', isYoutube: false };

    const ytId = getYouTubeId(url);
    if (ytId) {
        const autoPlayParam = autoPlay ? '?autoplay=1&rel=0' : '?rel=0';
        return {
            isIframe: true,
            embedUrl: `https://www.youtube.com/embed/${ytId}${autoPlayParam}`,
            isYoutube: true,
            ytId
        };
    }

    if (url.includes('vimeo.com') || url.includes('embed')) {
        return {
            isIframe: true,
            embedUrl: url,
            isYoutube: false
        };
    }

    return {
        isIframe: false,
        embedUrl: url,
        isYoutube: false
    };
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    videoUrl,
    thumbnailUrl,
    title,
    durationMinutes,
    autoPlay = false,
    className = ''
}) => {
    const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
    const { isIframe, embedUrl, ytId } = formatVideoSource(videoUrl, true);

    // Fallback YouTube high-res thumbnail if no custom thumbnail provided
    const derivedYoutubeThumbnail = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
    const effectiveThumbnail = thumbnailUrl || derivedYoutubeThumbnail;

    return (
        <div className={`relative w-full aspect-video bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 group select-none ${className}`}>
            {isPlaying ? (
                <div className="w-full h-full relative">
                    {isIframe ? (
                        <iframe
                            src={embedUrl}
                            title={title || 'Video Player'}
                            className="w-full h-full border-0 rounded-3xl"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    ) : (
                        <video
                            src={videoUrl}
                            poster={effectiveThumbnail || undefined}
                            controls
                            autoPlay
                            className="w-full h-full rounded-3xl object-contain bg-black"
                        >
                            Your browser does not support HTML5 video playback.
                        </video>
                    )}
                </div>
            ) : (
                /* Professional Video Thumbnail Splash Screen */
                <div
                    onClick={() => setIsPlaying(true)}
                    className="relative w-full h-full cursor-pointer overflow-hidden flex items-center justify-center group"
                >
                    {/* Thumbnail Image */}
                    {effectiveThumbnail ? (
                        <img
                            src={effectiveThumbnail}
                            alt={title || 'Video Thumbnail'}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center">
                            <Video className="w-20 h-20 text-blue-500/20" />
                        </div>
                    )}

                    {/* Gradient & Lighting Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/60 group-hover:via-slate-950/30 transition-all duration-300"></div>

                    {/* Top Header Badge */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                        {title && (
                            <div className="px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-xs font-bold truncate max-w-[80%] flex items-center gap-2 shadow-lg">
                                <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span className="truncate">{title}</span>
                            </div>
                        )}
                        <span className="px-3 py-1 rounded-full bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                            HD Video
                        </span>
                    </div>

                    {/* Center Animated Play Button */}
                    <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className="relative flex items-center justify-center">
                            {/* Ambient Glow */}
                            <div className="absolute -inset-4 bg-blue-600/40 rounded-full blur-xl group-hover:bg-blue-500/60 transition-all duration-500"></div>
                            
                            {/* Pulse Ring */}
                            <div className="absolute w-20 h-20 bg-white/20 rounded-full animate-ping pointer-events-none opacity-40"></div>

                            {/* Button Body */}
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-2xl border border-white/30 text-white transform group-hover:scale-110 group-active:scale-95 transition-all duration-300">
                                <Play className="w-8 h-8 sm:w-9 sm:h-9 ml-1 fill-white" />
                            </div>
                        </div>
                        <span className="text-white text-xs font-extrabold tracking-wide uppercase px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:bg-blue-600/80 transition-colors">
                            Click to Play Lesson
                        </span>
                    </div>

                    {/* Bottom Metadata Bar */}
                    {durationMinutes && durationMinutes > 0 ? (
                        <div className="absolute bottom-4 right-4 z-10">
                            <div className="px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-slate-200 text-xs font-extrabold flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-400" />
                                <span>{durationMinutes} Mins</span>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
