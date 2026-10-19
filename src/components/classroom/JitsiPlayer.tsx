import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import type { JitsiTokenResponse } from '../../types/liveClass.types';

declare global {
    interface Window {
        JitsiMeetExternalAPI: any;
    }
}

export interface JitsiPlayerRef {
    endConference: () => void;
    hangup: () => void;
    muteEveryone: () => void;
    toggleAudio: () => void;
    toggleVideo: () => void;
}

interface JitsiPlayerProps {
    roomConfig: JitsiTokenResponse;
    user: {
        id?: string;
        name: string;
        email?: string;
        avatar?: string;
    };
    isInstructor: boolean;
    onReadyToClose?: () => void;
    onEndConference?: () => void;
    onParticipantCountChange?: (count: number) => void;
    className?: string;
}

export const JitsiPlayer = forwardRef<JitsiPlayerRef, JitsiPlayerProps>(({
    roomConfig,
    user,
    isInstructor,
    onReadyToClose,
    onEndConference,
    onParticipantCountChange,
    className = ''
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [scriptError, setScriptError] = useState<string | null>(null);
    const [selfHealedNotice, setSelfHealedNotice] = useState<boolean>(false);

    // Keep participant registry for moderator self-healing
    const participantsMap = useRef<Map<string, { id: string; displayName: string; role?: string }>>(new Map());

    // Expose control handles to parent component (e.g. End For All button in Classroom UI)
    useImperativeHandle(ref, () => ({
        endConference: () => {
            if (apiRef.current) {
                try {
                    apiRef.current.executeCommand('endConference');
                } catch (e) {
                    console.warn("endConference command error:", e);
                }
            }
        },
        hangup: () => {
            if (apiRef.current) {
                try {
                    apiRef.current.executeCommand('hangup');
                } catch (e) {
                    console.warn("hangup command error:", e);
                }
            }
        },
        muteEveryone: () => {
            if (apiRef.current) {
                try {
                    apiRef.current.executeCommand('muteEveryone');
                } catch (e) {
                    console.warn("muteEveryone command error:", e);
                }
            }
        },
        toggleAudio: () => {
            if (apiRef.current) apiRef.current.executeCommand('toggleAudio');
        },
        toggleVideo: () => {
            if (apiRef.current) apiRef.current.executeCommand('toggleVideo');
        }
    }));

    useEffect(() => {
        let isMounted = true;
        const domain = roomConfig.domain || '8x8.vc';
        const scriptUrl = domain.includes('8x8.vc') 
            ? (roomConfig.appId ? `https://8x8.vc/${roomConfig.appId}/external_api.js` : 'https://8x8.vc/external_api.js')
            : `https://${domain}/external_api.js`;

        const loadScript = (): Promise<void> => {
            return new Promise((resolve, reject) => {
                if (window.JitsiMeetExternalAPI) {
                    return resolve();
                }

                // Check if script tag already injected
                const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
                if (existingScript) {
                    existingScript.addEventListener('load', () => resolve());
                    existingScript.addEventListener('error', () => reject(new Error('Failed to load Jitsi API script.')));
                    return;
                }

                const script = document.createElement('script');
                script.src = scriptUrl;
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Failed to load external video engine from ${scriptUrl}`));
                document.body.appendChild(script);
            });
        };

        const initializeJitsi = async () => {
            try {
                setLoading(true);
                setScriptError(null);
                await loadScript();

                if (!isMounted || !containerRef.current) return;

                // Cleanup existing instance if any
                if (apiRef.current) {
                    apiRef.current.dispose();
                    apiRef.current = null;
                }

                // Role-based toolbars
                const instructorToolbar = [
                    'microphone', 'camera', 'desktop', 'chat', 'raisehand', 
                    'participants-pane', 'tileview', 'fullscreen', 'security', 
                    'mute-everyone', 'hangup'
                ];
                const studentToolbar = [
                    'microphone', 'camera', 'chat', 'raisehand', 
                    'tileview', 'fullscreen', 'hangup'
                ];

                const displayName = user.name 
                    ? `${user.name}${isInstructor ? ' (Host)' : ''}` 
                    : (isInstructor ? 'Instructor (Host)' : 'Student');

                // Enforce config hash to guarantee skipping Jitsi's prejoin lobby
                const baseRoom = roomConfig.roomName;
                const cleanRoom = baseRoom.includes('#') 
                    ? baseRoom 
                    : `${baseRoom}#config.prejoinPageEnabled=false&config.prejoinConfig.enabled=false`;

                // Jitsi External API Options
                const options = {
                    roomName: cleanRoom,
                    parentNode: containerRef.current,
                    width: '100%',
                    height: '100%',
                    jwt: roomConfig.token || undefined,
                    userInfo: {
                        displayName,
                        email: user.email || '',
                        avatarUrl: user.avatar || ''
                    },
                    configOverwrite: {
                        startWithAudioMuted: !isInstructor,
                        startWithVideoMuted: !isInstructor,
                        prejoinPageEnabled: false,
                        prejoinConfig: {
                            enabled: false
                        },
                        disableDeepLinking: true,
                        enableWelcomePage: false,
                        enableClosePage: false,
                        toolbarButtons: isInstructor ? instructorToolbar : studentToolbar,
                        disableRemoteMute: !isInstructor,
                        remoteVideoMenu: {
                            disableKick: !isInstructor,
                            disableGrantModerator: !isInstructor
                        },
                        p2p: {
                            enabled: false
                        },
                        disableThirdPartyRequests: true,
                        liveStreamingEnabled: isInstructor,
                        fileRecordingsEnabled: isInstructor
                    },
                    interfaceConfigOverwrite: {
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        SHOW_POWERED_BY: false,
                        DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
                        TOOLBAR_BUTTONS: isInstructor ? instructorToolbar : studentToolbar,
                        SETTINGS_SECTIONS: isInstructor 
                            ? ['devices', 'language', 'moderator', 'profile'] 
                            : ['devices', 'language', 'profile'],
                        DISABLE_JOIN_LEAVE_NOTIFICATIONS: false
                    }
                };

                const api = new window.JitsiMeetExternalAPI(domain, options);
                apiRef.current = api;
                setLoading(false);

                // Enforce 100% full width and height on injected Jitsi iframe
                const enforceIframeSize = () => {
                    if (containerRef.current) {
                        const iframe = containerRef.current.querySelector('iframe');
                        if (iframe) {
                            iframe.style.width = '100%';
                            iframe.style.height = '100%';
                            iframe.style.minHeight = '100%';
                            iframe.style.display = 'block';
                            iframe.style.border = '0';
                            iframe.style.flex = '1';
                        }
                    }
                };
                enforceIframeSize();
                const resizeTimer = setInterval(enforceIframeSize, 300);
                setTimeout(() => clearInterval(resizeTimer), 6000);

                // --- Event Listeners & Moderation Controls ---

                api.addEventListener('videoConferenceJoined', (participant: any) => {
                    console.log("[Jitsi] Joined virtual classroom successfully:", participant);
                    setLoading(false);
                });

                api.addEventListener('participantJoined', (participant: any) => {
                    participantsMap.current.set(participant.id, {
                        id: participant.id,
                        displayName: participant.displayName || '',
                        role: participant.role
                    });
                    if (onParticipantCountChange) {
                        onParticipantCountChange(participantsMap.current.size + 1);
                    }
                });

                api.addEventListener('participantLeft', (participant: any) => {
                    participantsMap.current.delete(participant.id);
                    if (onParticipantCountChange) {
                        onParticipantCountChange(participantsMap.current.size + 1);
                    }
                });

                // --- Moderator Self-Healing Mechanism (Edge Case Protection) ---
                api.addEventListener('participantRoleChanged', (event: any) => {
                    // Check if current participant is a student but was unexpectedly granted 'moderator'
                    if (!isInstructor && event.role === 'moderator' && event.id === 'local') {
                        console.warn("[Jitsi Self-Healing] Student client received moderator role. Searching for Instructor to hand over...");
                        // Scan participant list for Host
                        let instructorFoundId: string | null = null;
                        for (const [id, p] of participantsMap.current.entries()) {
                            if (p.displayName.includes('(Host)') || p.displayName.toLowerCase().includes('instructor')) {
                                instructorFoundId = id;
                                break;
                            }
                        }

                        if (instructorFoundId) {
                            try {
                                api.executeCommand('grantModerator', instructorFoundId);
                                setSelfHealedNotice(true);
                                setTimeout(() => setSelfHealedNotice(false), 4000);
                                console.log(`[Jitsi Self-Healing] Successfully returned moderator control to Host: ${instructorFoundId}`);
                            } catch (err) {
                                console.error("[Jitsi Self-Healing] Failed to execute grantModerator:", err);
                            }
                        }
                    }
                });

                api.addEventListener('readyToClose', () => {
                    console.log("[Jitsi] readyToClose event received.");
                    if (onReadyToClose) onReadyToClose();
                });

                api.addEventListener('videoConferenceLeft', () => {
                    console.log("[Jitsi] videoConferenceLeft event received.");
                    if (onReadyToClose) onReadyToClose();
                });

            } catch (err: any) {
                console.error("Error initializing Jitsi Meet Virtual Classroom:", err);
                if (isMounted) {
                    setScriptError(err.message || 'Failed to initialize live video classroom.');
                    setLoading(false);
                }
            }
        };

        initializeJitsi();

        return () => {
            isMounted = false;
            if (apiRef.current) {
                try {
                    apiRef.current.dispose();
                } catch (e) {
                    console.warn("Dispose error:", e);
                }
                apiRef.current = null;
            }
        };
    }, [roomConfig.roomName, roomConfig.token, roomConfig.domain, isInstructor]);

    return (
        <div 
            className={`relative w-full h-full flex-1 flex flex-col min-h-0 bg-[#070D1E] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl ${className}`}
            style={{ width: '100%', height: '100%', minHeight: '100%' }}
        >
            {/* Loading Indicator */}
            {loading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#070D1E]/95 text-white backdrop-blur-sm">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
                    <h4 className="text-lg font-bold text-white tracking-tight">Connecting to Virtual Classroom...</h4>
                    <p className="text-xs text-slate-400 mt-1">Configuring secure role credentials & encrypted channel</p>
                </div>
            )}

            {/* Error Fallback */}
            {scriptError && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#070D1E] text-white p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
                    <h4 className="text-lg font-bold text-white">Classroom Connection Error</h4>
                    <p className="text-sm text-slate-400 max-w-md mt-1 mb-4">{scriptError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                        Retry Connection
                    </button>
                </div>
            )}

            {/* Self-Healing Toast Notification */}
            {selfHealedNotice && (
                <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-medium shadow-xl backdrop-blur-md animate-fade-in">
                    <ShieldAlert size={16} className="text-emerald-400" />
                    <span>Self-healing active: Host privileges secured.</span>
                </div>
            )}

            {/* Jitsi Iframe Mount Target */}
            <div 
                ref={containerRef} 
                className="w-full h-full flex-1 min-h-0 flex flex-col [&>iframe]:!w-full [&>iframe]:!h-full [&>iframe]:!min-h-full [&>iframe]:!border-0 [&>iframe]:!block [&>iframe]:!flex-1"
                style={{ width: '100%', height: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column' }}
            />
        </div>
    );
});

JitsiPlayer.displayName = 'JitsiPlayer';
export default JitsiPlayer;
