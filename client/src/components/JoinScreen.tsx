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
        <div className="min-h-dynamic-screen flex items-center justify-center mesh-gradient relative overflow-hidden">
            {/* Background elements */}
            <div className="mesh-glow pointer-events-none">
                <div className="mesh-ball w-[800px] h-[800px] bg-cyan-500/10 -top-1/4 -left-1/4" />
                <div className="mesh-ball w-[600px] h-[600px] bg-purple-500/10 -bottom-1/4 -right-1/4" />
                <div className="mesh-ball w-[400px] h-[400px] bg-emerald-500/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                <div className="text-center mb-10 px-4">
                    {/* Animated logo */}
                    <div className="relative inline-flex items-center justify-center mb-8">
                        <div className="absolute w-28 h-28 rounded-3xl bg-cyan-500/20 blur-3xl animate-pulse" />
                        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl glow-cyan animate-morph">
                            <span className="text-3xl font-black text-white tracking-tighter">WS</span>
                        </div>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tighter text-glow-cyan">
                        SELECT <span className="text-white/40">ROOM</span>
                    </h1>
                    <p className="text-gray-500 text-[10px] font-black tracking-[0.4em] uppercase opacity-70">
                        Agent: <span className="text-cyan-400/80">{username}</span>
                    </p>
                </div>


                <div className="glass-panel rounded-[40px] p-8 sm:p-12 shadow-2xl border-white/10 relative overflow-hidden">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Room input */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Namespace</label>
                            <div className="relative group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-cyan-400/40 font-black text-xl transition-colors group-focus-within:text-cyan-400">#</span>
                                <input
                                    type="text"
                                    value={room}
                                    onChange={(e) => setRoom(e.target.value)}
                                    placeholder="Room Name"
                                    maxLength={50}
                                    className="w-full pl-12 pr-16 py-5 glass-input rounded-3xl text-white placeholder-gray-700 outline-none text-base sm:text-sm font-bold transition-all"
                                />
                                <span className={`absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black tracking-widest transition-colors ${room.length > 40 ? 'text-rose-500' : 'text-gray-700'}`}>
                                    {room.length}/50
                                </span>
                            </div>
                        </div>

                        {/* Popular room chips */}
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Common Nodes</p>
                            <div className="flex flex-wrap gap-2.5">
                                {POPULAR_ROOMS.map((r) => (
                                    <button
                                        key={r.name}
                                        type="button"
                                        onClick={() => setRoom(r.name)}
                                        className={`px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 border ${room === r.name
                                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 glow-ring-cyan'
                                            : 'bg-white/[0.02] text-gray-600 border-white/[0.05] hover:bg-white/[0.06] hover:text-gray-300'
                                            }`}
                                    >
                                        <span className="text-lg grayscale-0 group-hover:grayscale-0">{r.emoji}</span>
                                        <span>{r.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-rose-400 text-[11px] font-black bg-rose-400/5 border border-rose-400/10 rounded-2xl px-6 py-4 flex items-center gap-3 uppercase tracking-tighter"
                            >
                                FIX: {error}
                            </motion.p>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading || !isConnected}
                            className="w-full py-5 rounded-2xl font-black text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 shadow-xl shadow-cyan-500/20 transition-all duration-300 disabled:opacity-40 text-xs tracking-[0.2em] uppercase relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative flex items-center justify-center gap-3">
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        BOOTING...
                                    </>
                                ) : (
                                    <>
                                        INITIALIZE UPLINK
                                    </>
                                )}
                            </span>
                        </motion.button>
                    </form>

                    {/* Connection status */}
                    <div className="flex items-center justify-center gap-3 mt-10 pt-8 border-t border-white/[0.04]">
                        <span className="relative flex h-2 w-2">
                            {isConnected && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                            )}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'}`} />
                        </span>
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">
                            {isConnected ? 'NODE CONNECTED' : 'AWAITING UPLINK...'}
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
