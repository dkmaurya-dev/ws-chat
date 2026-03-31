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
        <div className="w-full h-full lg:w-80 glass-panel flex flex-col relative overflow-hidden">
            {/* Animated edge glow */}
            <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-cyan-500/20 via-purple-500/20 to-emerald-500/20" />


            {/* Logo header */}
            <div className="p-6 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg glow-cyan group-hover:scale-110 transition-transform duration-300">
                                <span className="text-sm font-black text-white tracking-tight">WS</span>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0a0f1d] z-10" />
                        </div>
                        <div>
                            <h1 className="font-bold text-white text-[15px] tracking-tight text-glow-cyan">WS Chat</h1>
                            <p className="text-[10px] text-gray-500 leading-tight uppercase tracking-widest font-semibold opacity-50">Enterprise 1.0</p>
                        </div>
                    </div>

                    {/* Close Button for mobile */}
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="lg:hidden w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-rose-500/20 hover:border-rose-500/30 flex items-center justify-center text-gray-500 hover:text-rose-400 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </motion.button>
                </div>
            </div>

            {/* Current user card */}
            <div className="px-4 py-6">
                <div className="glass-item p-3.5 rounded-[20px] flex items-center gap-3 border-white/[0.08]">
                    <div className="relative">
                        <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-xl animate-morph"
                            style={{ backgroundColor: getAvatarColor(currentUser || '') }}
                        >
                            {currentUser?.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0a0f1d] shadow-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate tracking-tight">{currentUser}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="text-[9px] text-emerald-400/80 font-bold tracking-widest uppercase">System Online</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation / Switcher */}
            <div className="px-4 space-y-3 mb-4">
                <p className="text-[10px] text-gray-500 px-1 font-black uppercase tracking-[0.2em] opacity-40">Navigation</p>
                <button
                    onClick={() => setShowRoomList(!showRoomList)}
                    className={`w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-2xl transition-all duration-300 group ${showRoomList ? 'bg-cyan-500/10 border border-cyan-500/20' : 'glass-item border-white/[0.05]'}`}
                >
                    <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${showRoomList ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-400 group-hover:text-cyan-400'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                        </div>
                        <span className={`text-sm font-bold truncate ${showRoomList ? 'text-cyan-300' : 'text-gray-400 group-hover:text-gray-200'}`}>
                            {currentRoom}
                        </span>
                    </div>
                    <motion.svg
                        animate={{ rotate: showRoomList ? 180 : 0 }}
                        className={`w-3.5 h-3.5 ${showRoomList ? 'text-cyan-400' : 'text-gray-600'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </motion.svg>
                </button>

                {/* Quick room suggestions */}
                <AnimatePresence>
                    {showRoomList && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-black/20 rounded-2xl"
                        >
                            <div className="p-1 space-y-0.5">
                                {QUICK_ROOMS.map((r) => (
                                    <button
                                        key={r.name}
                                        onClick={() => handleSwitchRoom(r.name)}
                                        disabled={r.name === currentRoom || switchingTo !== null}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 ${r.name === currentRoom
                                            ? 'bg-cyan-500/10 text-cyan-300 glow-ring-cyan'
                                            : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.05]'
                                            }`}
                                    >
                                        <span className="text-base">{r.emoji}</span>
                                        <span className="font-bold">{r.name}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={() => setShowDMList(!showDMList)}
                    className={`w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-2xl transition-all duration-300 group ${showDMList ? 'bg-purple-500/10 border border-purple-500/20' : 'glass-item border-white/[0.05]'}`}
                >
                    <div className="flex items-center gap-2.5">
                         <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${showDMList ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-400 group-hover:text-purple-400'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                            </svg>
                        </div>
                        <span className={`text-sm font-bold truncate ${showDMList ? 'text-purple-300' : 'text-gray-400 group-hover:text-gray-200'}`}>
                            Private Comms
                        </span>
                    </div>
                    <motion.svg
                        animate={{ rotate: showDMList ? 180 : 0 }}
                        className={`w-3.5 h-3.5 ${showDMList ? 'text-purple-400' : 'text-gray-600'}`}
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
                            className="overflow-hidden bg-black/20 rounded-2xl"
                        >
                            <div className="p-1 space-y-0.5">
                                {allUsers.filter(u => u._id !== currentUserId).map((u) => {
                                    const sortedIds = [currentUserId, u._id].sort();
                                    const roomName = `dm_${sortedIds[0]}_${sortedIds[1]}`;
                                    const unreadCount = unreadDMs[u._id] || 0;
                                    const isOnline = onlineUsers.has(u._id) || onlineUsers.has(u.username);

                                    return (
                                        <button
                                            key={u._id}
                                            onClick={() => handleSwitchRoom(roomName, u._id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all duration-200 ${roomName === currentRoom
                                                ? 'bg-purple-500/10 text-purple-300'
                                                : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.05]'
                                                }`}
                                        >
                                            <div className="relative">
                                                <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center text-[10px] font-bold">
                                                    {u.username.charAt(0).toUpperCase()}
                                                </div>
                                                {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-black" />}
                                            </div>
                                            <span className="font-bold truncate">{u.username}</span>
                                            {unreadCount > 0 && roomName !== currentRoom && (
                                                <span className="ml-auto w-4 h-4 bg-rose-500 text-white text-[9px] rounded-full flex items-center justify-center font-black">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* People List */}
            <div className="flex-1 overflow-y-auto px-4">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] opacity-40">
                        Operational nodes
                    </h3>
                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/10">
                        {roomUsers.length}
                    </span>
                </div>

                <AnimatePresence mode="popLayout">
                    {roomUsers.map((user, index) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-item mb-2.5 p-2.5 rounded-2xl flex items-center gap-3 border-white/[0.04] group cursor-pointer hover:glow-ring-cyan"
                        >
                            <div className="relative">
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg group-hover:scale-105 transition-transform"
                                    style={{ backgroundColor: getAvatarColor(user.username) }}
                                >
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0a0f1d]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-gray-200 truncate">
                                    {user.username}
                                    {user.username === currentUser && <span className="ml-1.5 text-[9px] text-cyan-400 opacity-60">OWNER</span>}
                                </p>
                                <p className="text-[10px] text-gray-600 font-medium tracking-tight">
                                    latency 42ms • {getRelativeTime(user.joinedAt)}
                                </p>
                            </div>

                            {typingUsers.has(user.username) && (
                                <div className="flex gap-[2px] items-center px-1.5">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                                            className="w-1 h-1 bg-cyan-400 rounded-full"
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Bottom Bar */}
            <div className="p-4 border-t border-white/[0.06] bg-black/20">
                <button
                    onClick={onLeave}
                    className="w-full py-3 rounded-2xl text-xs font-bold text-rose-400 bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                    </svg>
                    Disconnect Node
                </button>
            </div>
        </div>
    );
}
