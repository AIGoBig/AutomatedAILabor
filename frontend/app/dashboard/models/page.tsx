"use client";

import React, { useEffect, useState } from "react";
import { Activity, Play, CheckCircle2, AlertCircle, RefreshCcw, Send } from "lucide-react";

export default function ModelsPage() {
    const [models, setModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [testResult, setTestResult] = useState<any>(null);
    const [testing, setTesting] = useState(false);
    const [selectedModel, setSelectedModel] = useState("");

    useEffect(() => {
        const fetchModels = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/models`);
                const data = await res.json();
                setModels(data.models || []);
                if (data.models?.length > 0) setSelectedModel(data.models[0].id);
            } catch (error) {
                console.error("Failed to fetch models:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchModels();
    }, []);

    const testModel = async () => {
        if (!selectedModel) return;
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/models/test`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model_id: selectedModel, prompt: "Verify model health." })
            });
            const data = await res.json();
            setTestResult(data);
        } catch (error) {
            setTestResult({ status: "error", detail: "网络请求失败" });
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tighter text-white flex items-center gap-3">
                    <Activity className="text-emerald-500" />
                    模型状态 & 质量评估
                </h1>
                <p className="text-neutral-500">检测 AI 劳动力群落的实时连接性与响应质量。</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Model List */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500 px-2">可用模型矩阵</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {models.map((m) => (
                            <div
                                key={m.id}
                                onClick={() => setSelectedModel(m.id)}
                                className={`p-6 rounded-3xl border transition-all cursor-pointer ${selectedModel === m.id
                                        ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                        : "bg-neutral-900/50 border-white/5 hover:border-white/10"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 rounded-xl bg-white/5">
                                        <Activity size={18} className={selectedModel === m.id ? "text-emerald-400" : "text-neutral-500"} />
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                        Active
                                    </div>
                                </div>
                                <h4 className="text-lg font-bold text-white mb-1">{m.id}</h4>
                                <p className="text-xs text-neutral-500 mb-4">{m.description}</p>
                                <div className="text-[10px] text-neutral-600 font-mono">PROVIDER: {m.provider}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Test Panel */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500 px-2">健康度即时检测</h3>
                    <div className="p-8 rounded-3xl bg-neutral-900/50 border border-white/5 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs text-neutral-400 ml-1">测试模型</label>
                            <div className="px-4 py-3 rounded-2xl bg-black border border-white/10 text-emerald-400 font-mono text-sm">
                                {selectedModel || "无"}
                            </div>
                        </div>

                        <button
                            onClick={testModel}
                            disabled={testing || !selectedModel}
                            className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all disabled:opacity-50"
                        >
                            {testing ? <RefreshCcw className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
                            发起测试请求
                        </button>

                        {testResult && (
                            <div className={`p-4 rounded-2xl border ${testResult.status === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
                                }`}>
                                <div className="flex items-center gap-2 mb-3">
                                    {testResult.status === 'success'
                                        ? <CheckCircle2 size={16} className="text-emerald-400" />
                                        : <AlertCircle size={16} className="text-red-400" />
                                    }
                                    <span className={`text-xs font-bold uppercase ${testResult.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {testResult.status === 'success' ? '通信正常' : '连接中断'}
                                    </span>
                                </div>
                                {testResult.status === 'success' ? (
                                    <div className="space-y-3">
                                        <p className="text-xs text-neutral-400 leading-relaxed font-mono bg-black/40 p-3 rounded-xl">
                                            "{testResult.response}"
                                        </p>
                                        <div className="flex gap-4 text-[10px] font-mono text-neutral-500">
                                            <span>INPUT: {testResult.usage.input}T</span>
                                            <span>OUTPUT: {testResult.usage.output}T</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-red-300/70 leading-relaxed font-mono">
                                        {testResult.detail}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
