'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ExternalLink, Check, Copy, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const [apiKey, setApiKey] = useState('');
    const [showIframe, setShowIframe] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('token');
        if (stored) {
            setApiKey(stored);
        }
    }, []);

    const handleSave = () => {
        setSaving(true);
        setSaved(false);
        localStorage.setItem('token', apiKey.trim());
        localStorage.setItem('api_key', apiKey.trim());
        setTimeout(() => {
            setSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }, 500);
    };

    const handleClear = () => {
        setApiKey('');
        localStorage.removeItem('token');
        localStorage.removeItem('api_key');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(apiKey);
    };

    return (
        <div className="flex-1 text-white selection:bg-emerald-500/30">
            <main className="py-12 px-8 max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-white mb-2">增强设置</h1>
                    <p className="text-neutral-400">管理 API Key 和模型配置</p>
                </div>

                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Left: Settings Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* API Key Card */}
                        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                    <KeyRound size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">API Key</h3>
                                    <p className="text-xs text-neutral-500">用于调用 AI 模型</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        type={showKey ? 'text' : 'password'}
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono pr-20"
                                        placeholder="sk-xxxxxxxxxxxxxxxx"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                        <button
                                            onClick={() => setShowKey(!showKey)}
                                            className="p-1.5 rounded hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
                                            title="显示/隐藏"
                                        >
                                            {showKey ? (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                        {apiKey && (
                                            <button
                                                onClick={handleCopy}
                                                className="p-1.5 rounded hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
                                                title="复制"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving || !apiKey.trim()}
                                        className="flex-1 bg-emerald-500 text-black font-bold py-2.5 rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}
                                        {saved ? '已保存' : saving ? '保存中' : '保存'}
                                    </button>
                                    {apiKey && (
                                        <button
                                            onClick={handleClear}
                                            className="px-4 py-2.5 border border-white/10 text-neutral-400 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                                        >
                                            清除
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-4">快速链接</h3>
                            <div className="space-y-3">
                                <a
                                    href="http://api.ecodeai.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group"
                                >
                                    <ExternalLink size={16} className="text-neutral-500 group-hover:text-emerald-400" />
                                    <div>
                                        <div className="text-sm font-medium text-white">API 管理平台</div>
                                        <div className="text-xs text-neutral-500">api.ecodeai.com</div>
                                    </div>
                                </a>
                                <button
                                    onClick={() => setShowIframe(!showIframe)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                                >
                                    {showIframe ? <ChevronUp size={16} className="text-emerald-400" /> : <ChevronDown size={16} className="text-neutral-500" />}
                                    <div className="text-left">
                                        <div className="text-sm font-medium text-white">
                                            {showIframe ? '收起' : '打开'} 内嵌 API 管理
                                        </div>
                                        <div className="text-xs text-neutral-500">在页面内操作</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Current Model Info */}
                        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-2">当前默认模型</h3>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                <span className="text-sm font-bold text-emerald-400">GLM-5</span>
                                <span className="text-xs text-neutral-500 ml-auto">综合最优</span>
                            </div>
                            <p className="text-xs text-neutral-600 mt-3">
                                创建任务时默认使用 GLM-5，如需其他模型请在 API 管理平台获取对应 Key
                            </p>
                        </div>
                    </div>

                    {/* Right: Embedded API Management */}
                    <div className="lg:col-span-3">
                        {showIframe ? (
                            <div className="w-full h-[calc(100vh-200px)] min-h-[500px] rounded-2xl border border-white/10 overflow-hidden bg-neutral-900/30">
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
                                    src="http://api.ecodeai.com"
                                    className="w-full h-full border-0"
                                    title="API Management"
                                    allow="clipboard-read; clipboard-write"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-[calc(100vh-200px)] min-h-[500px] rounded-2xl border border-white/10 border-dashed flex flex-col items-center justify-center bg-neutral-900/20 text-neutral-500">
                                <KeyRound size={48} className="mb-4 opacity-30" />
                                <p className="text-lg font-medium mb-2">API 管理面板</p>
                                <p className="text-sm text-neutral-600 mb-4">点击左侧"打开内嵌 API 管理"查看</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
