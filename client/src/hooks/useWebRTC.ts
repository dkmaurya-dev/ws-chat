'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { CallState, SignalingData } from '@/types/chat';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export function useWebRTC(socket: Socket | null) {
    const [callState, setCallState] = useState<CallState>({
        status: 'idle',
        remoteSocketId: null,
        remoteUserName: null,
        localStream: null,
        remoteStream: null,
    });

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

    const cleanup = useCallback(() => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        pendingOfferRef.current = null;
        setCallState({
            status: 'idle',
            remoteSocketId: null,
            remoteUserName: null,
            localStream: null,
            remoteStream: null,
        });
    }, []);

    const initPeerConnection = useCallback((remoteSocketId: string) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit('ice_candidate', { to: remoteSocketId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            setCallState(prev => ({ ...prev, remoteStream: event.streams[0] }));
        };

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        pcRef.current = pc;
        return pc;
    }, [socket]);

    const startCall = useCallback(async (targetSocketId: string, targetUserName: string) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;

            setCallState({
                status: 'calling',
                remoteSocketId: targetSocketId,
                remoteUserName: targetUserName,
                localStream: stream,
                remoteStream: null,
            });

            const pc = initPeerConnection(targetSocketId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket?.emit('call_user', { to: targetSocketId, offer });
        } catch (err) {
            console.error('Failed to start call:', err);
            cleanup();
        }
    }, [socket, initPeerConnection, cleanup]);

    const acceptCall = useCallback(async () => {
        const offer = pendingOfferRef.current;
        if (!callState.remoteSocketId || !socket || !offer) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;

            const pc = initPeerConnection(callState.remoteSocketId);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('answer_call', { to: callState.remoteSocketId, answer });

            setCallState(prev => ({
                ...prev,
                status: 'ongoing',
                localStream: stream
            }));

            pendingOfferRef.current = null;
        } catch (err) {
            console.error('Failed to accept call:', err);
            cleanup();
        }
    }, [callState.remoteSocketId, socket, initPeerConnection, cleanup]);

    const endCall = useCallback(() => {
        if (callState.remoteSocketId && socket) {
            socket.emit('end_call', { to: callState.remoteSocketId });
        }
        cleanup();
    }, [callState.remoteSocketId, socket, cleanup]);

    useEffect(() => {
        if (!socket) return;

        socket.on('incoming_call', async ({ from, offer, callerName }: SignalingData) => {
            setCallState({
                status: 'incoming',
                remoteSocketId: from,
                remoteUserName: callerName || 'Unknown',
                localStream: null,
                remoteStream: null,
            });
            if (offer) {
                pendingOfferRef.current = offer;
            }
        });

        socket.on('call_answered', async ({ answer }: SignalingData) => {
            if (pcRef.current && answer) {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                setCallState(prev => ({ ...prev, status: 'ongoing' }));
            }
        });

        socket.on('ice_candidate', async ({ candidate }: SignalingData) => {
            if (pcRef.current && candidate) {
                try {
                    await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error('Error adding ice candidate', e);
                }
            }
        });

        socket.on('call_ended', () => {
            cleanup();
        });

        return () => {
            socket.off('incoming_call');
            socket.off('call_answered');
            socket.off('ice_candidate');
            socket.off('call_ended');
        };
    }, [socket, cleanup]);

    return {
        callState,
        startCall,
        acceptCall,
        endCall,
        rejectCall: cleanup,
    };
}
