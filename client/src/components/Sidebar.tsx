'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RoomUser, JoinRoomResponse, GlobalUser } from '@/types/chat';

interface SidebarProps {
    currentUser: string | null;
    currentUserId: string | null;
    currentRoom: string | null;
    roomUsers: RoomUser[];
    isConnected: boolean;
    onLeave: () => void;
    typingUsers: Map<string, boolean>;
    onlineUsers: Set<string>;
    allUsers: GlobalUser[];
    unreadDMs: Record<string, number>;
    clearUnreadDM: (id: string) => void;
    onClose: () => void;
    onSwitchRoom?: (room: string) => Promise<JoinRoomResponse>;
    onCall?: (user: RoomUser) => void;
}

const QUICK_ROOMS = [
    { name: 'General', emoji: '💬' },
    { name: 'Random', emoji: '🎲' },
    { name: 'Gaming', emoji: '🎮' },
    { name: 'Music', emoji: '🎵' },
    { name: 'Code', emoji: '💻' },
    { name: 'Design', emoji: '🎨' },
];

function getAvatarColor(name: string) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
        '#BB8FCE', '#85C1E9', '#F0B27A', '#AED6F1',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function getRelativeTime(isoString: string): string {
    const now = Date.now();
    const then = new Date(isoString).getTime();
    const diffSec = Math.floor((now - then) / 1000);
    if (diffSec < 10) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
}

export default function Sidebar({
    currentUser,
    currentUserId,
    currentRoom,
    roomUsers,
    isConnected,
    onLeave,
    typingUsers,
    onlineUsers,
    allUsers,
    unreadDMs,
    clearUnreadDM,
    onClose,
    onSwitchRoom,
    onCall,
}: SidebarProps) {
    const [showRoomList, setShowRoomList] = useState(false);
    const [showDMList, setShowDMList] = useState(true);
    const [switchingTo, setSwitchingTo] = useState<string | null>(null);

    const handleSwitchRoom = useCallback(async (roomName: string, dmUserId?: string) => {
        if (roomName === currentRoom || !onSwitchRoom || !currentUser) return;
        setSwitchingTo(roomName);
        if (dmUserId) clearUnreadDM(dmUserId);
        try {
            await onSwitchRoom(roomName);
        } catch {
            // ignore
        }
        setSwitchingTo(null);
    }, [currentRoom, onSwitchRoom, currentUser, clearUnreadDM]);

    return (
        <div className="w-80 bg-[#0d1225]/98 backdrop-blur-2xl border-r border-white/[0.06] flex flex-col h-full shadow-2xl shadow-black/30 relative">
            {/* Animated gradient edge glow */}
            <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-cyan-500/20 via-purple-500/20 to-emerald-500/20 animate-gradient-shift" style={{ backgroundSize: '100% 200%' }} />

            {/* Logo header */}
            <div className="p-5 border-b border-white/[0.06]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg glow-cyan">
                                <span className="text-sm font-black text-white tracking-tight">WS</span>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0d1225]" />
                        </div>
                        <div>
                            <h1 className="font-bold text-white text-[15px] tracking-tight">WS Chat</h1>
                            <p className="text-[10px] text-gray-500 leading-tight">real-time • minimal • secure</p>
                        </div>
                    </div>
                    {/* Mobile close button */}
                    <button
                        onClick={onClose}
                        className="lg:hidden w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Current user card */}
            <div className="px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-white/[0.04] to-white/[0.02] rounded-xl border border-white/[0.04]">
                    <div className="relative">
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md"
                            style={{ backgroundColor: getAvatarColor(currentUser || '') }}
                        >
                            {currentUser?.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-[1.5px] border-[#0d1225]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{currentUser}</p>
                        <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block" />
                            Online
                        </p>
                    </div>
                </div>
            </div>

            {/* Room info */}
            <div className="px-4 py-3 border-b border-white/[0.06]">
                <button
                    onClick={() => setShowRoomList(!showRoomList)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-cyan-500/[0.08] border border-cyan-500/20 rounded-xl hover:bg-cyan-500/[0.12] transition-all group"
                >
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        <span className="text-sm font-medium text-cyan-300 truncate">{currentRoom}</span>
                    </div>
                    <motion.svg
                        animate={{ rotate: showRoomList ? 180 : 0 }}
                        className="w-3.5 h-3.5 text-cyan-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </motion.svg>
                </button>

                {/* Quick room suggestions — clickable! */}
                <AnimatePresence>
                    {showRoomList && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-2 space-y-0.5">
                                <p className="text-[10px] text-gray-600 px-1 mb-1.5 uppercase tracking-wider font-medium">Switch Room</p>
                                {QUICK_ROOMS.map((r) => (
                                    <motion.button
                                        key={r.name}
                                        whileHover={{ x: 2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSwitchRoom(r.name)}
                                        disabled={r.name === currentRoom || switchingTo !== null}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-200 ${r.name === currentRoom
                                            ? 'bg-cyan-500/10 text-cyan-300 cursor-default'
                                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05] cursor-pointer'
                                            } ${switchingTo === r.name ? 'opacity-60' : ''}`}
                                    >
                                        <span className="text-sm">{r.emoji}</span>
                                        <span className="font-medium">{r.name}</span>
                                        {r.name === currentRoom && (
                                            <span className="ml-auto text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full font-semibold">active</span>
                                        )}
                                        {switchingTo === r.name && (
                                            <svg className="ml-auto w-3.5 h-3.5 animate-spin text-cyan-400" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Direct Messages Dropdown */}
                <button
                    onClick={() => setShowDMList(!showDMList)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 mt-2 bg-purple-500/[0.08] border border-purple-500/20 rounded-xl hover:bg-purple-500/[0.12] transition-all group"
                >
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                        </svg>
                        <span className="text-sm font-medium text-purple-300 truncate">Direct Messages</span>
                    </div>
                    <motion.svg
                        animate={{ rotate: showDMList ? 180 : 0 }}
                        className="w-3.5 h-3.5 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </motion.svg>
                </button>

                <AnimatePresence>
                    {showDMList && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-2 space-y-0.5">
                                {allUsers.filter(u => u._id !== currentUserId).length === 0 ? (
                                    <div className="px-3 py-4 text-center border border-white/5 rounded-lg bg-white/[0.02]">
                                        <p className="text-xs text-gray-400 font-medium">No one else is here!</p>
                                        <p className="text-[10px] text-gray-600 mt-1.5 leading-tight">Register a second account in an incognito window to test DMs.</p>
                                    </div>
                                ) : allUsers.filter(u => u._id !== currentUserId).map((u) => {
                                    const sortedIds = [currentUserId, u._id].sort();
                                    const roomName = `dm_${sortedIds[0]}_${sortedIds[1]}`;
                                    const isOnline = onlineUsers.has(u._id) || onlineUsers.has(u.username);
                                    const isSubSwitching = switchingTo === roomName;
                                    const unreadCount = unreadDMs[u._id] || 0;

                                    return (
                                        <motion.button
                                            key={u._id}
                                            whileHover={{ x: 2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleSwitchRoom(roomName, u._id)}
                                            disabled={roomName === currentRoom || switchingTo !== null}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-200 ${roomName === currentRoom
                                                ? 'bg-purple-500/10 text-purple-300 cursor-default'
                                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05] cursor-pointer'
                                                } ${isSubSwitching ? 'opacity-60' : ''}`}
                                        >
                                            <div className="relative">
                                                <div
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase"
                                                    style={{ backgroundColor: getAvatarColor(u.username) }}
                                                >
                                                    {u.username.charAt(0)}
                                                </div>
                                                {isOnline && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-[#0d1225]" />
                                                )}
                                            </div>
                                            <span className="font-medium truncate">{u.username}</span>

                                            {unreadCount > 0 && roomName !== currentRoom && (
                                                <span className="ml-auto text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                                                    {unreadCount > 9 ? '9+' : unreadCount}
                                                </span>
                                            )}

                                            {roomName === currentRoom && (
                                                <span className="ml-auto text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-semibold">active</span>
                                            )}
                                            {isSubSwitching && (
                                                <svg className="ml-auto w-3.5 h-3.5 animate-spin text-purple-400" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            )}
                                        </motion.button>
                                    );
                                })
                                }
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Status bar */}
            <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
                <p className="text-[10px] text-gray-600 px-1">
                    Status: <span className={isConnected ? 'text-emerald-400/80' : 'text-red-400/80'}>{isConnected ? 'connected' : 'offline'}</span>
                </p>
                <div className="flex items-center gap-1.5">
                    <motion.span
                        key={roomUsers.length}
                        initial={{ scale: 1.5, color: '#22d3ee' }}
                        animate={{ scale: 1, color: '#4b5563' }}
                        transition={{ duration: 0.3 }}
                        className="text-[10px] font-bold"
                    >
                        {roomUsers.length}
                    </motion.span>
                    <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                </div>
            </div>

            {/* People in room */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
                <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                    <span>People in room</span>
                    <motion.span
                        key={roomUsers.length}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-500/15 to-purple-500/15 text-[10px] font-bold flex items-center justify-center text-cyan-400 border border-cyan-500/10"
                    >
                        {roomUsers.length}
                    </motion.span>
                </h3>
                <AnimatePresence mode="popLayout">
                    {roomUsers.map((user, index) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -20, scale: 0.95 }}
                            transition={{ duration: 0.25, delay: index * 0.05 }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all duration-200 mb-0.5 group cursor-default"
                        >
                            {/* Avatar with online pulse */}
                            <div className="relative flex-shrink-0">
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg"
                                    style={{
                                        backgroundColor: getAvatarColor(user.username),
                                        boxShadow: `0 4px 12px ${getAvatarColor(user.username)}33`,
                                    }}
                                >
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                {/* Online pulse ring */}
                                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-[1.5px] border-[#0d1225]" />
                                </span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-gray-200 truncate flex items-center gap-1.5">
                                    {user.username}
                                    {user.username === currentUser && (
                                        <span className="text-[9px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded-full font-semibold">you</span>
                                    )}
                                </p>
                                <p className="text-[10px] text-gray-600 truncate group-hover:text-gray-500 transition-colors">
                                    joined {getRelativeTime(user.joinedAt)}
                                </p>
                            </div>

                            {typingUsers.has(user.username) && user.username !== currentUser && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex gap-[3px] px-2 py-1.5 bg-cyan-500/10 rounded-full"
                                >
                                    {[0, 1, 2].map((i) => (
                                        <motion.span
                                            key={i}
                                            animate={{ y: [-2, 2, -2], opacity: [0.4, 1, 0.4] }}
                                            transition={{
                                                duration: 0.8,
                                                repeat: Infinity,
                                                delay: i * 0.15,
                                            }}
                                            className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
                                        />
                                    ))}
                                </motion.div>
                            )}

                            {/* Video call button */}
                            {user.username !== currentUser && onCall && (
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCall(user);
                                    }}
                                    className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-cyan-500 hover:text-white"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </motion.button>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {roomUsers.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-600 text-xs">No one else is here yet</p>
                    </div>
                )}
            </div>

            {/* Bottom bar */}
            <div className="p-4 border-t border-white/[0.06] space-y-3">
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onLeave}
                    className="w-full py-2.5 rounded-xl text-sm font-medium text-red-400 bg-red-500/[0.08] border border-red-500/15 hover:bg-red-500/[0.15] hover:border-red-500/25 transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Leave Room
                </motion.button>

                <div className="flex items-center justify-center gap-2">
                    <span className="relative flex h-2 w-2">
                        {isConnected && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    </span>
                    <span className="text-[10px] text-gray-600">
                        {isConnected ? 'Connected • Socket.io' : 'Reconnecting...'}
                    </span>
                </div>
            </div>
        </div>
    );
}
