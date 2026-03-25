'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface JoinScreenProps {
    onJoin: (room: string) => Promise<{ success?: boolean; error?: string }>;
    isConnected: boolean;
    username: string;
}

const POPULAR_ROOMS = [
    { name: 'General', emoji: '💬' },
    { name: 'Random', emoji: '🎲' },
    { name: 'Gaming', emoji: '🎮' },
    { name: 'Music', emoji: '🎵' },
    { name: 'Code', emoji: '💻' },
    { name: 'Design', emoji: '🎨' },
];

// Floating particle component
function FloatingParticle({ delay, size, x, y, duration }: { delay: number; size: number; x: string; y: string; duration: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
                opacity: [0, 0.6, 0],
                scale: [0, 1, 0.5],
                y: [0, -120, -200],
                x: [0, Math.random() > 0.5 ? 30 : -30, 0],
            }}
            transition={{
                duration,
                delay,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
            className="absolute rounded-full"
            style={{
                left: x,
                top: y,
                width: size,
                height: size,
                background: `radial-gradient(circle, rgba(34,211,238,0.3), rgba(168,85,247,0.1))`,
            }}
        />
    );
}

export default function JoinScreen({ onJoin, isConnected, username }: JoinScreenProps) {
    const [room, setRoom] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const particles = useMemo(
        () =>
            Array.from({ length: 16 }, (_, i) => ({
                id: i,
                delay: Math.random() * 8,
                size: Math.random() * 6 + 2,
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                duration: Math.random() * 6 + 6,
            })),
        []
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!room.trim()) {
            setError('Room name is required');
            return;
        }

        setIsLoading(true);
        setError('');

        const response = await onJoin(room.trim());
        if (response.error) {
            setError(response.error);
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a] relative overflow-hidden noise-overlay">
            {/* Animated background orbs */}
            <div className="absolute inset-0">
                <motion.div
                    animate={{
                        x: [0, 100, -50, 0],
                        y: [0, -100, 50, 0],
                        scale: [1, 1.2, 0.9, 1],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[140px] animate-pulse-glow"
                />
                <motion.div
                    animate={{
                        x: [0, -80, 60, 0],
                        y: [0, 80, -60, 0],
                        scale: [1, 0.9, 1.1, 1],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[140px] animate-pulse-glow"
                    style={{ animationDelay: '2s' }}
                />
                <motion.div
                    animate={{
                        x: [0, 50, -80, 0],
                        y: [0, -50, 80, 0],
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                    className="absolute top-1/2 left-1/2 w-72 h-72 bg-emerald-500/6 rounded-full blur-[120px]"
                />

                {/* Floating particles */}
                {particles.map((p) => (
                    <FloatingParticle key={p.id} {...p} />
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-center mb-8"
                >
                    {/* Animated logo ... */}
                    <div className="relative inline-flex items-center justify-center mb-5">
                        <div className="absolute w-20 h-20 rounded-2xl animate-spin-slow"
                            style={{
                                background: 'conic-gradient(from 0deg, rgba(34,211,238,0.4), rgba(168,85,247,0.4), rgba(52,211,153,0.4), rgba(34,211,238,0.4))',
                                filter: 'blur(8px)',
                            }}
                        />
                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg glow-cyan">
                            <span className="text-2xl font-black text-white tracking-tight">WS</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                        Hi, <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{username}</span>
                    </h1>
                    <p className="text-gray-500 text-sm tracking-wide">Where do you want to chat today?</p>
                </motion.div>

                {/* Glass card */}
                <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 shadow-2xl animate-border-glow">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Room input */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Room Name</label>
                            <div className="relative">
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                                <input
                                    type="text"
                                    value={room}
                                    onChange={(e) => setRoom(e.target.value)}
                                    placeholder="Enter room name..."
                                    maxLength={50}
                                    className="w-full pl-11 pr-14 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/15 transition-all duration-300 text-sm"
                                />
                                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono transition-colors ${room.length > 40 ? 'text-amber-400' : 'text-gray-600'}`}>
                                    {room.length}/50
                                </span>
                            </div>
                        </div>

                        {/* Popular room chips */}
                        <div>
                            <p className="text-[10px] text-gray-600 mb-2 uppercase tracking-wider font-medium">Popular Rooms</p>
                            <div className="flex flex-wrap gap-2">
                                {POPULAR_ROOMS.map((r) => (
                                    <motion.button
                                        key={r.name}
                                        type="button"
                                        whileHover={{ scale: 1.05, y: -1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setRoom(r.name)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${room === r.name
                                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm glow-cyan'
                                            : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-gray-300'
                                            }`}
                                    >
                                        <span>{r.emoji}</span>
                                        <span>{r.name}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                {error}
                            </motion.p>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading || !isConnected}
                            className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 shadow-lg shadow-cyan-500/25 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed text-sm tracking-wide relative overflow-hidden group"
                        >
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative">
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Joining...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                        Join Room
                                    </span>
                                )}
                            </span>
                        </motion.button>
                    </form>

                    {/* Connection status */}
                    <div className="flex items-center justify-center gap-2 mt-6 pt-5 border-t border-white/[0.04]">
                        <span className="relative flex h-2 w-2">
                            {isConnected && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                            )}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`} />
                        </span>
                        <span className="text-[11px] text-gray-500">
                            {isConnected ? 'Connected to server' : 'Reconnecting...'}
                        </span>
                    </div>
                </div>

                <p className="text-center text-gray-600/60 text-[10px] mt-6 tracking-wide">
                    Usernames must be unique per room.
                </p>
            </motion.div>
        </div>
    );
}
