'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ChatMessage, RoomUser, TypingUser, JoinRoomResponse } from '@/types/chat';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';

export function useSocket(token: string | null) {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
    const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(new Map());
    const [currentRoom, setCurrentRoom] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [avatarColor, setAvatarColor] = useState<string>('#4ECDC4');
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Notification sound
    const playNotification = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);
            oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.3);
        } catch {
            // Silently fail if audio not available
        }
    }, []);

    // Connect to server
    useEffect(() => {
        if (!token) return;

        const socket = io(SERVER_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            console.log('Connected to server');
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            console.log('Disconnected from server');
        });

        socket.on('message', (message: ChatMessage) => {
            setMessages((prev) => [...prev, message]);
            // Play notification for other user messages
            if (message.type === 'user') {
                playNotification();
            }
        });

        socket.on('room_users', (users: RoomUser[]) => {
            setRoomUsers(users);
            setOnlineUsers(new Set(users.map((u) => u.username)));
        });

        socket.on('user_typing', ({ username, isTyping }: TypingUser) => {
            setTypingUsers((prev) => {
                const next = new Map(prev);
                if (isTyping) {
                    next.set(username, true);
                } else {
                    next.delete(username);
                }
                return next;
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [token, playNotification]);

    // Join room
    const joinRoom = useCallback((room: string): Promise<JoinRoomResponse> => {
        return new Promise((resolve) => {
            if (!socketRef.current) {
                resolve({ error: 'Not connected to server' });
                return;
            }

            socketRef.current.emit('join_room', { room }, (response: JoinRoomResponse & { history?: ChatMessage[] }) => {
                if (response.success) {
                    setCurrentRoom(response.room || room);
                    setCurrentUser(response.username || null);
                    setAvatarColor(response.avatarColor || '#4ECDC4');
                    setMessages(response.history || []);
                    setTypingUsers(new Map());
                }
                resolve(response);
            });
        });
    }, []);

    // Send message
    const sendMessage = useCallback((content: string) => {
        if (!socketRef.current || !currentRoom) return;

        socketRef.current.emit('send_message', { content }, (response: { success?: boolean; error?: string }) => {
            if (response.error) {
                console.error('Send error:', response.error);
            }
        });
    }, [currentRoom]);

    // Typing indicator
    const emitTyping = useCallback(() => {
        if (!socketRef.current) return;

        socketRef.current.emit('typing_start');

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current?.emit('typing_stop');
        }, 2000);
    }, []);

    // Leave room
    const leaveRoom = useCallback(() => {
        if (!socketRef.current) return;

        socketRef.current.emit('leave_room', () => {
            setCurrentRoom(null);
            setCurrentUser(null);
            setMessages([]);
            setRoomUsers([]);
            setTypingUsers(new Map());
            setOnlineUsers(new Set());
        });
    }, []);

    return {
        isConnected,
        messages,
        roomUsers,
        typingUsers,
        currentRoom,
        currentUser,
        avatarColor,
        onlineUsers,
        socket: socketRef.current,
        joinRoom,
        sendMessage,
        emitTyping,
        leaveRoom,
    };
}
