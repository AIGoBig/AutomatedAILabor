'use client';

import Link from 'next/link';
import { Cpu, ExternalLink, Zap, ArrowLeft } from 'lucide-react';

export default function SettingsPage() {
    const models = [
        { name: 'GLM-5', desc: '默认模型 · 综合最优', status: 'default' },
        { name: 'Gemini 3 Flash', desc: '极速预览', status: 'available' },
        { name: 'Gemini 3 Pro High', desc: '最强推理', status: 'available' },
        { name: 'Claude 4.5 Sonnet', desc: '代码推理', status: 'available' },
    ];

    return (
        <div className="flex-1 text-white selection:bg-emerald-500/30">
            <main className="py-12 px-8 max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-12 flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <ArrowLeft size={20} className="text-neutral-400" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">模型信息</h1>
                        <p className="text-neutral-400">查看当前可用的 AI 模型配置</p>
                    </div>
                </div>

                {/* Status Card */}
                <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-8 mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <Zap size={24} className="text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">后端模型已就绪</h3>
                            <p className="text-sm text-neutral-400">所有任务使用后端预置的免费模型凭证，无需额外配置</p>
                        </div>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        <span className="text-sm font-medium text-emerald-400">系统运行正常</span>
                    </div>
                </div>

                {/* Available Models */}
                <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-8 mb-8">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Cpu size={20} className="text-neutral-500" />
                        可用模型列表
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        {models.map((model) => (
                            <div
                                key={model.name}
                                className="p-5 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 transition-all"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-bold text-white">{model.name}</h4>
                                    {model.status === 'default' && (
                                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30">
                                            默认
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-neutral-500">{model.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* External Link */}
                <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-8">
                    <h3 className="text-lg font-bold text-white mb-4">需要更多模型？</h3>
                    <p className="text-sm text-neutral-400 mb-4">
                        如需使用更多高级模型，可前往 API 管理平台获取。
                    </p>
                    <a
                        href="http://api.ecodeai.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                    >
                        <ExternalLink size={16} className="text-neutral-500 group-hover:text-emerald-400" />
                        <span className="text-sm font-medium text-white">访问 API 管理平台</span>
                    </a>
                </div>
            </main>
        </div>
    );
}
