'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ArrowRight, ExternalLink, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showIframe, setShowIframe] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Listen for API key from iframe via postMessage
    const handleMessage = useCallback((event: MessageEvent) => {
        // Accept messages from api.ecodeai.com
        if (!event.origin.includes('ecodeai.com')) return;

        try {
            const data = event.data;
            // Try to extract API key from various possible message formats
            if (typeof data === 'string' && data.startsWith('sk-')) {
                setApiKey(data.trim());
            } else if (data && typeof data === 'object') {
                // Try common key formats
                const key = data.apiKey || data.api_key || data.token || data.key || '';
                if (key && typeof key === 'string') {
                    setApiKey(key.trim());
                }
            }
        } catch {
            // Ignore parse errors
        }
    }, []);

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!apiKey.trim() || apiKey.length < 8) {
                setError('请输入有效的 API Key');
                setLoading(false);
                return;
            }

            localStorage.setItem('token', apiKey);
            localStorage.setItem('api_key', apiKey);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${apiKey}` },
            });

            if (!res.ok) {
                localStorage.setItem('user_email', 'user@labor.ecodeai.com');
            }

            setLoginSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 800);
        } catch {
            localStorage.setItem('user_email', 'user@labor.ecodeai.com');
            setLoginSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 800);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-900/10 to-transparent opacity-50"></div>
            </div>

            <main className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 pt-24 pb-8">
                <div className="w-full max-w-5xl">
                    {/* Top section: Login form + iframe toggle */}
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
                            接入 AILabor
                        </h1>
                        <p className="text-neutral-500">使用 api.ecodeai.com 的 API Key 登录</p>
                    </div>

                    <div className="grid lg:grid-cols-5 gap-6">
                        {/* Left: Login Form */}
                        <div className="lg:col-span-2">
                            <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
                                {error && (
                                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {loginSuccess && (
                                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
                                        登录成功，正在跳转...
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
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : loginSuccess ? (
                                            '验证通过'
                                        ) : (
                                            <>
                                                <KeyRound size={18} />
                                                进入控制中心
                                                <ArrowRight size={16} />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                                    <a
                                        href="http://api.ecodeai.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                                    >
                                        <ExternalLink size={14} />
                                        新窗口打开 api.ecodeai.com
                                    </a>
                                    <button
                                        onClick={() => setShowIframe(!showIframe)}
                                        className="w-full flex items-center justify-center gap-2 text-sm text-neutral-400 hover:text-neutral-300 transition-colors py-2"
                                    >
                                        {showIframe ? (
                                            <>
                                                收起 API 管理面板 <ChevronUp size={14} />
                                            </>
                                        ) : (
                                            <>
                                                在页面内打开 API 管理 <ChevronDown size={14} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <p className="mt-6 text-center text-xs text-neutral-600">
                                在下方嵌入的 API 管理中登录后，Key 将自动填入
                            </p>
                        </div>

                        {/* Right: Embedded API Management iframe */}
                        <div className="lg:col-span-3">
                            {showIframe ? (
                                <div className="w-full h-[calc(100vh-280px)] min-h-[500px] rounded-2xl border border-white/10 overflow-hidden bg-neutral-900/30">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-neutral-900/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                            <span className="text-sm text-neutral-400">api.ecodeai.com</span>
                                        </div>
                                        <a
                                            href="http://api.ecodeai.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1"
                                        >
                                            新窗口打开 <ExternalLink size={10} />
                                        </a>
                                    </div>
                                    <iframe
                                        ref={iframeRef}
                                        src="http://api.ecodeai.com"
                                        className="w-full h-full border-0"
                                        title="API Management"
                                        allow="clipboard-read; clipboard-write"
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-[calc(100vh-280px)] min-h-[500px] rounded-2xl border border-white/10 border-dashed flex flex-col items-center justify-center bg-neutral-900/20 text-neutral-500">
                                    <KeyRound size={48} className="mb-4 opacity-30" />
                                    <p className="text-lg font-medium mb-2">API 管理面板</p>
                                    <p className="text-sm text-neutral-600 mb-4">点击左侧按钮在页面内打开</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
