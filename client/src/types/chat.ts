export interface ChatMessage {
    id: string;
    type: 'user' | 'system';
    username?: string;
    content: string;
    timestamp: string;
    avatarColor?: string;
    reactions?: Record<string, string[]>; // emoji -> list of usernames
    isDeleted?: boolean;
    replyTo?: {
        id: string;
        username: string;
        content: string;
    };
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

export interface GlobalUser {
    _id: string;
    username: string;
    avatarColor: string;
}

export interface DMNotification {
    room: string;
    fromUserId: string;
    fromUsername: string;
    message: string;
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
