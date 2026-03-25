'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageInputProps {
    onSend: (message: string) => void;
    onTyping: () => void;
    disabled?: boolean;
}

const EMOJI_CATEGORIES: { label: string; icon: string; emojis: string[] }[] = [
    {
        label: 'Smileys',
        icon: '😊',
        emojis: ['😀', '😂', '😍', '🥰', '😎', '🤔', '😅', '😊', '😢', '😤', '🤣', '😜', '🥺', '😇', '🤩', '😘'],
    },
    {
        label: 'Gestures',
        icon: '👍',
        emojis: ['👍', '👏', '🙌', '💪', '🙏', '👀', '🤝', '✌️', '🤞', '👋', '🫡', '🤙', '👊', '✊', '🤘', '🫶'],
    },
    {
        label: 'Hearts',
        icon: '❤️',
        emojis: ['❤️', '💕', '💖', '💗', '💓', '💝', '🩷', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔'],
    },
    {
        label: 'Objects',
        icon: '🎮',
        emojis: ['🔥', '✨', '🌟', '⭐', '🎉', '💯', '🎊', '🎈', '☕', '🍕', '🎮', '📱', '💻', '🎵', '🌈', '🦋'],
    },
];

const MAX_CHARS = 2000;

export default function MessageInput({ onSend, onTyping, disabled }: MessageInputProps) {
    const [message, setMessage] = useState('');
    const [showEmojis, setShowEmojis] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const emojiRef = useRef<HTMLDivElement>(null);

    const charPercent = Math.min((message.length / MAX_CHARS) * 100, 100);
    const nearLimit = message.length > MAX_CHARS * 0.8;
    const atLimit = message.length >= MAX_CHARS;

    // Click outside to close emoji picker
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
                setShowEmojis(false);
            }
        }
        if (showEmojis) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojis]);

    const handleSend = useCallback(() => {
        if (message.trim()) {
            onSend(message.trim());
            setMessage('');
            setShowEmojis(false);
            inputRef.current?.focus();
        }
    }, [message, onSend]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
        if (e.key === 'Escape' && showEmojis) {
            setShowEmojis(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
        onTyping();
    };

    const addEmoji = (emoji: string) => {
        setMessage((prev) => prev + emoji);
        inputRef.current?.focus();
    };

    return (
        <div className="relative px-4 sm:px-6 py-4 border-t border-white/[0.06] bg-[#0d1225]/90 backdrop-blur-xl" ref={emojiRef}>
            {/* Emoji picker */}
            <AnimatePresence>
                {showEmojis && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-4 sm:left-6 mb-2 bg-[#151a30] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 w-80 overflow-hidden"
                    >
                        {/* Category tabs */}
                        <div className="flex items-center gap-0.5 px-2 py-2 border-b border-white/[0.06] bg-white/[0.02]">
                            {EMOJI_CATEGORIES.map((cat, i) => (
                                <button
                                    key={cat.label}
                                    onClick={() => setActiveCategory(i)}
                                    className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-sm transition-all duration-200 ${activeCategory === i
                                            ? 'bg-cyan-500/15 scale-105'
                                            : 'hover:bg-white/[0.06]'
                                        }`}
                                    title={cat.label}
                                >
                                    {cat.icon}
                                </button>
                            ))}
                        </div>

                        {/* Category label */}
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-3 pt-2 pb-1">
                            {EMOJI_CATEGORIES[activeCategory].label}
                        </p>

                        {/* Emoji grid */}
                        <div className="grid grid-cols-8 gap-0.5 px-2 pb-3">
                            {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
                                <motion.button
                                    key={emoji}
                                    whileHover={{ scale: 1.3 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => addEmoji(emoji)}
                                    className="w-9 h-9 flex items-center justify-center text-lg hover:bg-white/[0.08] rounded-lg transition-colors duration-150"
                                >
                                    {emoji}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center gap-2 sm:gap-3">
                {/* Emoji toggle */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowEmojis(!showEmojis)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 ${showEmojis
                        ? 'bg-cyan-500/20 text-cyan-400 glow-cyan'
                        : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-gray-300'
                        }`}
                >
                    <span className="text-xl">{showEmojis ? '✕' : '😊'}</span>
                </motion.button>

                {/* Input field */}
                <div className="flex-1 relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={message}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Write a message..."
                        disabled={disabled}
                        maxLength={MAX_CHARS}
                        className="w-full px-4 pr-16 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/15 transition-all duration-300 disabled:opacity-50"
                    />
                    {/* Char counter ring */}
                    {message.length > 0 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {nearLimit && (
                                <span className={`text-[10px] font-mono ${atLimit ? 'text-red-400' : 'text-amber-400'}`}>
                                    {MAX_CHARS - message.length}
                                </span>
                            )}
                            <div className="relative w-5 h-5">
                                <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
                                    <circle
                                        cx="10" cy="10" r="8"
                                        stroke="rgba(255,255,255,0.06)"
                                        strokeWidth="2"
                                        fill="none"
                                    />
                                    <circle
                                        cx="10" cy="10" r="8"
                                        stroke={atLimit ? '#f87171' : nearLimit ? '#fbbf24' : '#22d3ee'}
                                        strokeWidth="2"
                                        fill="none"
                                        strokeDasharray={`${charPercent * 0.5027} 50.27`}
                                        strokeLinecap="round"
                                        className="transition-all duration-300"
                                    />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>

                {/* Send button - gradient icon */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={disabled || !message.trim()}
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 shadow-lg shadow-cyan-500/25 transition-all duration-300 disabled:opacity-25 disabled:cursor-not-allowed disabled:shadow-none flex-shrink-0"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                </motion.button>
            </div>
        </div>
    );
}
