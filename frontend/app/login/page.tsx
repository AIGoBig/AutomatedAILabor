'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ArrowRight, ExternalLink } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validate API key format
            if (!apiKey.trim() || apiKey.length < 8) {
                setError('请输入有效的 API Key');
                setLoading(false);
                return;
            }

            // Store API key and use it as the auth token
            localStorage.setItem('token', apiKey);
            localStorage.setItem('api_key', apiKey);

            // Verify by fetching user info
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${apiKey}` },
            });

            // Even if user info fails, let the user through (anonymous mode)
            if (!res.ok) {
                // Create anonymous session
                localStorage.setItem('user_email', 'user@labor.ecodeai.com');
            }

            router.push('/dashboard');
        } catch {
            // Allow anonymous access
            localStorage.setItem('user_email', 'user@labor.ecodeai.com');
            router.push('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-900/10 to-transparent opacity-50"></div>
            </div>

            <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
                            接入 AILabor
                        </h1>
                        <p className="text-neutral-500">使用 api.ecodeai.com 的 API Key 登录</p>
                    </div>

                    <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-neutral-500 font-mono">API Key</label>
                                <input
                                    type="text"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono"
                                    placeholder="sk-xxxxxxxxxxxxxxxx"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-500 text-black font-bold py-4 rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    '验证中...'
                                ) : (
                                    <>
                                        <KeyRound size={18} />
                                        进入控制中心
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-white/5">
                            <a
                                href="http://api.ecodeai.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                                <ExternalLink size={14} />
                                前往 api.ecodeai.com 获取 Key
                            </a>
                        </div>
                    </div>

                    <p className="mt-8 text-center text-xs text-neutral-600">
                        需要 api.ecodeai.com 账号才能获取 API Key
                    </p>
                </div>
            </main>
        </div>
    );
}
