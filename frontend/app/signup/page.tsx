"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("两次输入的密码不匹配。");
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Registration failed');
            }

            const data = await res.json();
            // Automatically log in (store token)
            localStorage.setItem('token', data.access_token);
            router.push('/start');
        } catch (err: any) {
            setError(err.message || '注册失败。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
            <Navbar />

            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-cyan-900/10 to-transparent opacity-50"></div>
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
            </div>

            <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
                            初始化
                        </h1>
                        <p className="text-neutral-500">创建您的操作员身份。</p>
                    </div>

                    <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSignup} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-neutral-500 font-mono">电子邮箱</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                                    placeholder="agent@company.com"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-neutral-500 font-mono">密码</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-neutral-500 font-mono">确认密码</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-cyan-500 text-black font-bold py-4 rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
                            >
                                {loading ? '正在初始化...' : '创建凭据'}
                            </button>
                        </form>
                    </div>

                    <div className="mt-8 text-center text-sm text-neutral-600">
                        已有身份？ <a href="/login" className="text-neutral-400 hover:text-white transition-colors">访问逻辑</a>
                    </div>
                </div>
            </main>
        </div>
    );
}
