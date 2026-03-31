'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services/api';

export default function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            let data;
            if (isLogin) {
                data = await authApi.login({ email: formData.email, password: formData.password });
            } else {
                data = await authApi.register(formData);
            }
            login(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-dynamic-screen flex items-center justify-center bg-[#060914] relative overflow-hidden noise-overlay">
            {/* Animated background orbs */}
            <div className="absolute inset-0">
                <motion.div
                    animate={{ x: [0, 80, -40, 0], y: [0, -60, 40, 0], scale: [1, 1.1, 0.9, 1] }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] opacity-40 animate-pulse-glow"
                />
                <motion.div
                    animate={{ x: [0, -60, 40, 0], y: [0, 80, -40, 0], scale: [1, 0.9, 1.1, 1] }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] opacity-40 animate-pulse-glow"
                />
            </div>


            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                <div className="text-center mb-8 px-4">
                    <motion.div 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="relative inline-flex items-center justify-center mb-6"
                    >
                        <div className="absolute w-20 h-20 rounded-2xl bg-cyan-500/20 blur-2xl animate-pulse" />
                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl glow-cyan animate-morph">
                            <span className="text-2xl font-black text-white tracking-tighter">WS</span>
                        </div>
                    </motion.div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-gray-400 text-sm font-medium tracking-wide">
                        {isLogin ? 'Sign in to continue chatting' : 'Join the WS Chat community'}
                    </p>
                </div>


                <div className="glass-morphism rounded-[2.5rem] p-8 sm:p-10 shadow-2xl border border-white/10 relative overflow-hidden group">
                    {/* Top inner glow */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                    
                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="space-y-1.5"
                                >
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-1">Username</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 focus:ring-4 focus:ring-cyan-500/5 transition-all text-base sm:text-sm"
                                        placeholder="Enter your username"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
 
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 focus:ring-4 focus:ring-cyan-500/5 transition-all text-sm"
                                placeholder="name@example.com"
                            />
                        </div>
 
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-1">Secure Password</label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 focus:ring-4 focus:ring-cyan-500/5 transition-all text-sm"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 shadow-xl shadow-cyan-500/20 transition-all duration-300 disabled:opacity-40 text-sm tracking-widest uppercase relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative">
                                {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
                            </span>
                        </motion.button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-gray-400 text-xs hover:text-cyan-400 transition-colors"
                        >
                            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
