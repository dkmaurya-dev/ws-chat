'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatMessage, GlobalUser } from '@/types/chat';

interface ChatAreaProps {
    messages: ChatMessage[];
    allMessagesCount: number;
    currentUser: string | null;
    currentRoom: string | null;
    typingUsers: Map<string, boolean>;
    onLeave: () => void;
    onToggleSidebar: () => void;
    sidebarOpen: boolean;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    roomUsersCount: number;
    allUsers: GlobalUser[];
    currentUserId: string | null;
}

function formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

function formatFullTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
}

function formatDateSeparator(timestamp: string): string {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
    });
}

function shouldShowDateSeparator(messages: ChatMessage[], index: number): boolean {
    if (index === 0) return true;
    const prev = new Date(messages[index - 1].timestamp).toDateString();
    const curr = new Date(messages[index].timestamp).toDateString();
    return prev !== curr;
}

/** Should we group this message with the previous one? */
function isGrouped(messages: ChatMessage[], index: number): boolean {
    if (index === 0) return false;
    const prev = messages[index - 1];
    const curr = messages[index];
    if (prev.type !== 'user' || curr.type !== 'user') return false;
    if (prev.username !== curr.username) return false;
    const timeDiff = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
    return timeDiff < 120_000; // 2 minutes
}

const REACTION_EMOJIS = ['❤️', '😂', '👍', '🔥', '😮'];

export default function ChatArea({
    messages,
    currentUser,
    currentRoom,
    typingUsers,
    onLeave,
    onToggleSidebar,
    sidebarOpen,
    searchQuery,
    onSearchChange,
    roomUsersCount,
    allUsers,
    currentUserId,
}: ChatAreaProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const isAtBottom = useRef(true);
    const [reactions, setReactions] = useState<Record<string, Record<string, string[]>>>({});

    const toggleReaction = useCallback((msgId: string, emoji: string, username: string) => {
        setReactions((prev) => {
            const msgReactions = prev[msgId] || {};
            const users = msgReactions[emoji] || [];
            const hasReacted = users.includes(username);
            const newUsers = hasReacted ? users.filter((u) => u !== username) : [...users, username];
            const newMsgReactions = { ...msgReactions, [emoji]: newUsers };
            // Clean up empty
            if (newUsers.length === 0) delete newMsgReactions[emoji];
            return { ...prev, [msgId]: newMsgReactions };
        });
    }, []);

    const scrollToBottom = useCallback(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        setUnreadCount(0);
    }, []);

    // Auto-scroll when messages arrive if user is at bottom
    useEffect(() => {
        if (isAtBottom.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else {
            setUnreadCount((prev) => prev + 1);
        }
    }, [messages]);

    // Scroll handler
    const handleScroll = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const threshold = 100;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
        isAtBottom.current = atBottom;
        setShowScrollBtn(!atBottom);
        if (atBottom) setUnreadCount(0);
    }, []);

    const activeTypers = Array.from(typingUsers.keys()).filter(
        (u) => u !== currentUser
    );

    const isSearching = searchQuery.trim().length > 0;

    const displayRoomName = useMemo(() => {
        if (!currentRoom) return '';
        if (currentRoom.startsWith('dm_')) {
            const [, id1, id2] = currentRoom.split('_');
            const targetId = id1 === currentUserId ? id2 : id1;
            const targetUser = allUsers.find(u => u._id === targetId);
            return targetUser ? targetUser.username : 'Direct Message';
        }
        return currentRoom;
    }, [currentRoom, currentUserId, allUsers]);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0f1729] relative">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-white/[0.06] bg-[#0d1225]/90 backdrop-blur-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Hamburger menu */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onToggleSidebar}
                        className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-gray-400 hover:text-white transition-all shrink-0"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {sidebarOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </motion.button>

                    <div className="min-w-0">
                        <h2 className="text-base font-semibold text-white truncate flex items-center gap-2">
                            <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {currentRoom?.startsWith('dm_') ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                )}
                            </svg>
                            <span className="text-cyan-400">{displayRoomName}</span>
                            {!currentRoom?.startsWith('dm_') && (
                                <span className="text-[10px] font-normal text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.04] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                    {roomUsersCount}
                                </span>
                            )}
                            <span className="text-[10px] font-normal text-gray-600 bg-white/[0.03] px-2 py-0.5 rounded-full">
                                {messages.length} msg{messages.length !== 1 ? 's' : ''}
                            </span>
                        </h2>
                        <AnimatePresence mode="wait">
                            {activeTypers.length > 0 ? (
                                <motion.p
                                    key="typing"
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="text-[11px] text-cyan-400/80 italic truncate flex items-center gap-1"
                                >
                                    <span className="flex gap-[2px]">
                                        {[0, 1, 2].map((i) => (
                                            <motion.span
                                                key={i}
                                                animate={{ opacity: [0.3, 1, 0.3] }}
                                                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                                                className="w-1 h-1 bg-cyan-400 rounded-full inline-block"
                                            />
                                        ))}
                                    </span>
                                    {activeTypers.length === 1
                                        ? `${activeTypers[0]} is typing`
                                        : `${activeTypers.slice(0, 3).join(', ')} are typing`}
                                </motion.p>
                            ) : (
                                <motion.p
                                    key="idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-[11px] text-gray-600 truncate"
                                >
                                    joined {currentRoom}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Search toggle */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            setShowSearch(!showSearch);
                            if (showSearch) onSearchChange('');
                        }}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${showSearch
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-white/[0.05] text-gray-400 hover:text-white hover:bg-white/[0.1]'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </motion.button>

                    {/* Leave button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onLeave}
                        className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 rounded-xl transition-all duration-200 shadow-lg shadow-red-500/20 flex items-center gap-1.5"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                        </svg>
                        Leave
                    </motion.button>
                </div>
            </div>

            {/* Search bar */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-b border-white/[0.06]"
                    >
                        <div className="px-4 sm:px-6 py-3 bg-[#0d1225]/60">
                            <div className="relative">
                                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    placeholder="Search messages..."
                                    autoFocus
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                                />
                                {isSearching && (
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">
                                        {messages.length} result{messages.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 sm:px-6 py-4"
            >
                {/* Empty state */}
                {messages.length === 0 && !isSearching && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/[0.06] flex items-center justify-center mb-6 animate-float"
                        >
                            <svg className="w-10 h-10 text-cyan-400/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </motion.div>
                        <motion.h3
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg font-semibold text-gray-300 mb-2"
                        >
                            No messages yet
                        </motion.h3>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-sm text-gray-600 max-w-xs"
                        >
                            Start the conversation! Say hi to everyone in <span className="text-cyan-400">{currentRoom}</span>.
                        </motion.p>
                    </div>
                )}

                {isSearching && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <svg className="w-12 h-12 text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-gray-500 text-sm">No messages matching &quot;{searchQuery}&quot;</p>
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {messages.map((msg, index) => {
                        const showDate = shouldShowDateSeparator(messages, index);
                        const grouped = isGrouped(messages, index);

                        return (
                            <div key={msg.id}>
                                {/* Date separator */}
                                {showDate && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-3 py-4"
                                    >
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                                        <span className="text-[10px] font-medium text-gray-600 bg-[#0f1729] px-3 py-1 rounded-full border border-white/[0.04]">
                                            {formatDateSeparator(msg.timestamp)}
                                        </span>
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                                    </motion.div>
                                )}

                                {msg.type === 'system' ? (
                                    <SystemMessage content={msg.content} />
                                ) : (
                                    <MessageBubble
                                        msg={msg}
                                        isOwn={msg.username === currentUser}
                                        grouped={grouped}
                                        msgReactions={reactions[msg.id] || {}}
                                        onToggleReaction={(emoji) => toggleReaction(msg.id, emoji, currentUser || '')}
                                    />
                                )}
                            </div>
                        );
                    })}
                </AnimatePresence>

                {/* Typing indicator at bottom */}
                <AnimatePresence>
                    {activeTypers.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex items-start gap-2 py-2 mt-1"
                        >
                            <div className="flex gap-[3px] bg-[#1e2442] px-4 py-3 rounded-2xl rounded-bl-md shadow-md border border-white/[0.04]">
                                {[0, 1, 2].map((i) => (
                                    <motion.span
                                        key={i}
                                        animate={{
                                            y: [-3, 3, -3],
                                            opacity: [0.3, 1, 0.3],
                                        }}
                                        transition={{
                                            duration: 1,
                                            repeat: Infinity,
                                            delay: i * 0.2,
                                        }}
                                        className="w-2 h-2 bg-cyan-400 rounded-full"
                                    />
                                ))}
                            </div>
                            <span className="text-[10px] text-gray-600 mt-2.5">
                                {activeTypers.join(', ')}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={bottomRef} />
            </div>

            {/* Scroll to bottom FAB */}
            <AnimatePresence>
                {showScrollBtn && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={scrollToBottom}
                        className="absolute bottom-4 right-6 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-400 text-white shadow-lg shadow-cyan-500/30 flex items-center justify-center z-10 hover:shadow-cyan-500/50 transition-shadow"
                    >
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ───── System Message ───── */
function SystemMessage({ content }: { content: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex justify-center py-2"
        >
            <span className="text-[11px] text-gray-500 bg-gradient-to-r from-white/[0.02] to-white/[0.04] px-4 py-1.5 rounded-full border border-white/[0.06] animate-border-glow flex items-center gap-1.5">
                <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {content}
            </span>
        </motion.div>
    );
}

/* ───── Message Bubble sub-component ───── */
function MessageBubble({
    msg,
    isOwn,
    grouped,
    msgReactions,
    onToggleReaction,
}: {
    msg: ChatMessage;
    isOwn: boolean;
    grouped: boolean;
    msgReactions: Record<string, string[]>;
    onToggleReaction: (emoji: string) => void;
}) {
    const [showActions, setShowActions] = useState(false);
    const [showTimestamp, setShowTimestamp] = useState(false);

    const hasReactions = Object.keys(msgReactions).length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${grouped ? 'mt-0.5' : 'mt-3'}`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => { setShowActions(false); setShowTimestamp(false); }}
        >
            {/* Username label — hidden if grouped */}
            {!grouped && (
                <span className={`text-[11px] font-medium mb-1 px-1 ${isOwn ? 'text-gray-500' : 'text-gray-400'}`}>
                    {msg.username}
                </span>
            )}

            {/* Message bubble row */}
            <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                {/* Avatar — hidden if grouped */}
                {!isOwn && !grouped && (
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-lg"
                        style={{
                            backgroundColor: msg.avatarColor || '#4ECDC4',
                            boxShadow: `0 4px 12px ${msg.avatarColor || '#4ECDC4'}33`,
                        }}
                    >
                        {msg.username?.charAt(0).toUpperCase()}
                    </div>
                )}
                {/* Spacer when avatar is hidden for grouped messages */}
                {!isOwn && grouped && <div className="w-8 flex-shrink-0" />}

                <div className="relative group">
                    <div
                        onClick={() => setShowTimestamp(!showTimestamp)}
                        className={`px-4 py-2.5 text-sm leading-relaxed break-words shadow-md transition-all duration-300 cursor-default ${isOwn
                            ? `bg-gradient-to-r from-cyan-500 to-teal-400 text-white shadow-cyan-500/10 hover:shadow-cyan-500/20 ${grouped ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-br-md'}`
                            : `bg-[#1e2442] text-gray-200 border border-white/[0.04] hover:border-white/[0.08] ${grouped ? 'rounded-2xl rounded-bl-md' : 'rounded-2xl rounded-bl-md'}`
                            }`}
                    >
                        {msg.content}
                    </div>

                    {/* Quick reactions (on hover) */}
                    <AnimatePresence>
                        {showActions && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.85, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.85, y: 5 }}
                                transition={{ duration: 0.12 }}
                                className={`absolute -top-9 ${isOwn ? 'right-0' : 'left-0'} flex items-center gap-0.5 bg-[#1a1f35] border border-white/10 rounded-full px-1.5 py-1 shadow-xl z-10`}
                            >
                                {REACTION_EMOJIS.map((emoji) => {
                                    const reacted = msgReactions[emoji]?.length > 0;
                                    return (
                                        <button
                                            key={emoji}
                                            onClick={() => onToggleReaction(emoji)}
                                            className={`w-7 h-7 flex items-center justify-center text-xs hover:scale-125 transition-all rounded-full ${reacted ? 'bg-cyan-500/15 scale-110' : 'hover:bg-white/10'}`}
                                        >
                                            {emoji}
                                        </button>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Reaction badges */}
                    {hasReactions && (
                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            {Object.entries(msgReactions)
                                .filter(([, users]) => users.length > 0)
                                .map(([emoji, users]) => (
                                    <motion.button
                                        key={emoji}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => onToggleReaction(emoji)}
                                        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.06] transition-all text-[11px]"
                                        title={users.join(', ')}
                                    >
                                        <span>{emoji}</span>
                                        <span className="text-gray-400 font-medium">{users.length}</span>
                                    </motion.button>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Timestamp — always visible for non-grouped, or on hover/click */}
            <AnimatePresence>
                {(!grouped || showTimestamp) && (
                    <motion.div
                        initial={grouped ? { opacity: 0, height: 0 } : { opacity: 1 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={grouped ? { opacity: 0, height: 0 } : {}}
                        className={`flex items-center gap-1.5 mt-1 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                        <span
                            className="text-[10px] text-gray-600 cursor-help"
                            title={formatFullTime(msg.timestamp)}
                        >
                            {formatTime(msg.timestamp)}
                        </span>
                        {isOwn && (
                            <svg className="w-3.5 h-3.5 text-cyan-400/60" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
