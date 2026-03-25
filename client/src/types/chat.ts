export interface ChatMessage {
    id: string;
    type: 'user' | 'system';
    username?: string;
    content: string;
    timestamp: string;
    avatarColor?: string;
    reactions?: Record<string, string[]>; // emoji -> list of usernames
}

export interface MessageReaction {
    emoji: string;
    users: string[];
}

export interface RoomUser {
    username: string;
    id: string;
    joinedAt: string;
}

export interface TypingUser {
    username: string;
    isTyping: boolean;
}

export interface JoinRoomResponse {
    success?: boolean;
    error?: string;
    room?: string;
    username?: string;
    users?: RoomUser[];
    avatarColor?: string;
}

export interface SignalingData {
    from: string;
    to?: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
    callerName?: string;
}

export type CallStatus = 'idle' | 'calling' | 'incoming' | 'ongoing';

export interface CallState {
    status: CallStatus;
    remoteSocketId: string | null;
    remoteUserName: string | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
}
