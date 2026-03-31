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
        <div className="min-h-dynamic-screen flex items-center justify-center mesh-gradient relative overflow-hidden">
            {/* Background elements */}
            <div className="mesh-glow pointer-events-none">
                <div className="mesh-ball w-[800px] h-[800px] bg-cyan-500/10 -top-1/4 -left-1/4" />
                <div className="mesh-ball w-[600px] h-[600px] bg-purple-500/10 -bottom-1/4 -right-1/4" />
                <div className="mesh-ball w-[400px] h-[400px] bg-emerald-500/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                <div className="text-center mb-10 px-4">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="relative inline-flex items-center justify-center mb-6 px-1"
                    >
                        <div className="absolute w-24 h-24 rounded-3xl bg-cyan-500/20 blur-3xl animate-pulse" />
                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl glow-cyan animate-morph">
                            <span className="text-2xl font-black text-white tracking-tighter">WS</span>
                        </div>
                    </motion.div>
                    <h1 className="text-3xl sm:text-5xl font-black text-white mb-3 tracking-tighter text-glow-cyan">
                        {isLogin ? 'WELCOME' : 'SIGN UP'}
                    </h1>
                    <p className="text-gray-500 text-xs font-bold tracking-[0.3em] uppercase opacity-60">
                        {isLogin ? 'Access encrypted network' : 'Initialize new node'}
                    </p>
                </div>


                <div className="glass-panel rounded-[32px] p-8 sm:p-12 shadow-2xl border-white/10 relative overflow-hidden">
                    <form onSubmit={handleSubmit} className="space-y-7 relative z-10">
                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2"
                                >
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">User Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full px-6 py-4 glass-input rounded-2xl text-white placeholder-gray-700 outline-none text-sm transition-all"
                                        placeholder="Identification"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">User ID</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-6 py-4 glass-input rounded-2xl text-white placeholder-gray-700 outline-none text-sm transition-all"
                                placeholder="name@domain.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Password</label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-6 py-4 glass-input rounded-2xl text-white placeholder-gray-700 outline-none text-sm transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-rose-400 text-[11px] font-bold bg-rose-400/5 border border-rose-400/10 rounded-xl px-4 py-3"
                            >
                                SYSTEM ERROR: {error.toUpperCase()}
                            </motion.p>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4.5 rounded-2xl font-black text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 shadow-xl shadow-cyan-500/20 transition-all duration-300 disabled:opacity-40 text-xs tracking-[0.2em] uppercase relative overflow-hidden"
                        >
                            <span className="relative">
                                {isLoading ? 'AUTHORIZING...' : isLogin ? 'CONNECT' : 'INITIALIZE'}
                            </span>
                        </motion.button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-gray-600 text-[10px] font-black uppercase tracking-[0.15em] hover:text-cyan-400 transition-colors"
                        >
                            {isLogin ? "Sign Up" : "Login to existing account"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
