"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, TrendingUp, CheckCircle2, AlertCircle, Clock, Activity } from "lucide-react";
import { apiGet } from "@/lib/api";

export default function AnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            try {
                const res = await apiGet('/api/stats', token);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen text-neutral-500">
                <Clock className="animate-spin mr-2" size={20} />
                正在加载统计数据...
            </div>
        );
    }

    const cards = [
        {
            title: "总任务数",
            value: stats?.total_missions || 0,
            icon: <TrendingUp className="text-emerald-400" size={20} />,
            label: "所有已发起的任务"
        },
        {
            title: "成功率",
            value: stats?.status_distribution?.completed ?
                Math.round((stats.status_distribution.completed / stats.total_missions) * 100) + "%" : "0%",
            icon: <CheckCircle2 className="text-emerald-400" size={20} />,
            label: "任务执行成功占比"
        },
        {
            title: "异常情况",
            value: stats?.status_distribution?.failed || 0,
            icon: <AlertCircle className="text-red-400" size={20} />,
            label: "执行失败的任务总数"
        }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3">
                    <BarChart3 className="text-emerald-500" size={32} />
                    调用统计 & 业务分析
                </h1>
                <p className="text-neutral-500 font-medium">实时监控任务执行状态与资源消耗比例。</p>
            </header>

            {/* Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="p-8 rounded-[2rem] glass hover:glass-hover transition-all duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-2xl bg-white/5 shadow-inner">
                                {card.icon}
                            </div>
                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{card.title}</span>
                        </div>
                        <div className="text-5xl font-black text-white mb-2 tracking-tighter">{card.value}</div>
                        <p className="text-xs text-neutral-500 font-medium">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Trend Chart */}
            <div className="p-10 rounded-[2.5rem] glass shadow-2xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tight mb-2">能量消耗趋势 (7D)</h3>
                        <p className="text-neutral-500 text-sm font-medium">历史 Token 活跃度与峰值分布。</p>
                    </div>
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 hs-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Input Tokens</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Output Tokens</span>
                        </div>
                    </div>
                </div>

                <div className="h-64 flex items-end gap-3 md:gap-6 px-2 border-b border-white/5 pb-4">
                    {(stats?.recent_trends || []).map((item: any, idx: number) => {
                        const maxVal = Math.max(...(stats?.recent_trends || []).map((t: any) => t.input + t.output), 1);
                        const inHeight = (item.input / maxVal) * 80; // Scale to 80% to leave room for labels
                        const outHeight = (item.output / maxVal) * 80;

                        return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end">
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 glass px-3 py-1.5 rounded-xl text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-20 shadow-2xl border border-white/10 scale-90 group-hover:scale-100">
                                    <div className="text-emerald-400">In: {item.input.toLocaleString()}</div>
                                    <div className="text-purple-400">Out: {item.output.toLocaleString()}</div>
                                </div>

                                <div className="w-full flex flex-col justify-end gap-1.5 h-full max-w-[40px]">
                                    <div
                                        className="w-full bg-purple-500/80 rounded-t-lg transition-all duration-700 group-hover:bg-purple-400 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                                        style={{ height: `${Math.max(outHeight, 5)}%` }}
                                    />
                                    <div
                                        className="w-full bg-emerald-500/80 rounded-t-lg transition-all duration-700 group-hover:bg-emerald-400 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                        style={{ height: `${Math.max(inHeight, 5)}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-tighter group-hover:text-white transition-colors">{item.date}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-8 rounded-[2.5rem] glass shadow-2xl">
                    <h3 className="text-xl font-black text-white mb-8 tracking-tight">任务详情分布</h3>
                    <div className="space-y-6">
                        {Object.entries(stats?.type_distribution || {}).map(([type, count]: [any, any]) => (
                            <div key={type} className="space-y-3">
                                <div className="flex justify-between text-[10px] text-neutral-400 uppercase tracking-widest font-black">
                                    <span>{type === 'research' ? '深度研究' : '代码工程'}</span>
                                    <span className="text-emerald-500">{count} 任务</span>
                                </div>
                                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                    <div
                                        className={`h-full rounded-full ${type === 'research' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-purple-500 shadow-[0_0_15px_#a855f7]'}`}
                                        style={{ width: `${(count / stats.total_missions) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 rounded-[2.5rem] glass shadow-2xl">
                    <h3 className="text-xl font-black text-white mb-8 tracking-tight">资源消耗概览</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-black/40 p-6 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                            <p className="text-[10px] text-neutral-500 mb-2 uppercase tracking-widest font-black">总输入能量</p>
                            <p className="text-2xl font-black text-white font-mono">{stats?.resource_usage?.total_input_tokens?.toLocaleString() || 0}</p>
                            <p className="text-[10px] text-neutral-600 mt-2 font-bold tracking-widest uppercase">Tokens</p>
                        </div>
                        <div className="bg-black/40 p-6 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                            <p className="text-[10px] text-neutral-500 mb-2 uppercase tracking-widest font-black">总输出能量</p>
                            <p className="text-2xl font-black text-white font-mono">{stats?.resource_usage?.total_output_tokens?.toLocaleString() || 0}</p>
                            <p className="text-[10px] text-neutral-600 mt-2 font-bold tracking-widest uppercase">Tokens</p>
                        </div>
                        <div className="glass-emerald p-6 rounded-2xl border-emerald-500/30">
                            <p className="text-[10px] text-emerald-500/60 mb-2 uppercase tracking-widest font-black">总结算支出</p>
                            <p className="text-2xl font-black text-emerald-400 font-mono tracking-tighter">{stats?.resource_usage?.total_cost?.toFixed(2) || "0.00"}</p>
                            <p className="text-[10px] text-emerald-900 mt-2 font-bold tracking-widest uppercase">Credits</p>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-white/10">
                        <div className="flex items-center gap-3 text-neutral-500 text-xs font-bold bg-white/5 p-4 rounded-xl border border-dashed border-white/10">
                            <Activity size={14} className="text-emerald-500" />
                            <span>资源利用率处于全天候稳定状态</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
