'use client';

import React, { useEffect, useRef } from 'react';
import { CallState } from '@/types/chat';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';

interface VideoCallProps {
    callState: CallState;
    onAccept: () => void;
    onReject: () => void;
    onEnd: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({ callState, onAccept, onReject, onEnd }) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && callState.localStream) {
            localVideoRef.current.srcObject = callState.localStream;
        }
    }, [callState.localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && callState.remoteStream) {
            remoteVideoRef.current.srcObject = callState.remoteStream;
        }
    }, [callState.remoteStream]);

    if (callState.status === 'idle') return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-4xl bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10">

                {/* Remote Video (Main) */}
                <div className="relative aspect-video bg-gray-800 flex items-center justify-center">
                    {callState.status === 'ongoing' && callState.remoteStream ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-white">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold">
                                {callState.remoteUserName?.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-xl font-medium">
                                {callState.status === 'calling' ? `Calling ${callState.remoteUserName}...` :
                                    callState.status === 'incoming' ? `${callState.remoteUserName} is calling...` :
                                        'Connecting...'}
                            </p>
                        </div>
                    )}

                    {/* Local Video (Floating) */}
                    <div className="absolute top-4 right-4 w-32 md:w-48 aspect-video bg-gray-700 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover mirror"
                        />
                    </div>
                </div>

                {/* Controls */}
                <div className="p-6 bg-gray-900/90 flex items-center justify-center gap-6">
                    {callState.status === 'incoming' ? (
                        <>
                            <button
                                onClick={onAccept}
                                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-all transform hover:scale-110 shadow-lg shadow-green-500/20"
                            >
                                <Phone className="w-6 h-6" />
                            </button>
                            <button
                                onClick={onReject}
                                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all transform hover:scale-110 shadow-lg shadow-red-500/20"
                            >
                                <PhoneOff className="w-6 h-6" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                                <Mic className="w-5 h-5" />
                            </button>
                            <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                                <Video className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onEnd}
                                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all transform hover:scale-110 shadow-lg shadow-red-500/20"
                            >
                                <PhoneOff className="w-6 h-6" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
                .mirror {
                    transform: scaleX(-1);
                }
            `}</style>
        </div>
    );
};

export default VideoCall;
