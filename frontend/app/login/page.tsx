"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new URLSearchParams();
            formData.append('username', email); // OAuth2 expects 'username'
            formData.append('password', password);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData,
            });

            if (!res.ok) throw new Error('Invalid credentials');

            const data = await res.json();
            localStorage.setItem('token', data.access_token);
            router.push('/dashboard/start'); // Redirect to a protected route (or dashboard)
        } catch (err) {
            setError('登录失败。请检查您的邮箱和密码。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
            <Navbar />

            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-900/10 to-transparent opacity-50"></div>
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
            </div>

            <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
                            身份验证
                        </h1>
                        <p className="text-neutral-500">进入系统。</p>
                    </div>

                    <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-neutral-500 font-mono">电子邮箱</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono"
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
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-black font-bold py-4 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? '正在验证...' : '进入控制中心'}
                            </button>
                        </form>
                    </div>

                    <div className="mt-8 text-center text-sm text-neutral-600">
                        还没有账号？ <a href="/signup" className="text-neutral-400 hover:text-white transition-colors">初始化协议</a>
                    </div>
                </div>
            </main>
        </div>
    );
}
