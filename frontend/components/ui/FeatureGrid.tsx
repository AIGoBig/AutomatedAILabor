'use client';

import { Zap, CheckCircle, Activity, Car, Microscope, BarChart3 } from 'lucide-react';

export default function FeatureGrid() {
    return (
        <section id="features" className="py-24 px-6 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-6">
                        为什么选择&ldquo;自动化劳动力&rdquo;？
                    </h2>
                    <p className="text-neutral-400 max-w-2xl mx-auto">
                        我们重新定义了 AI 的工作方式。无需提示词工程，无需冗长对话，直接交付成果。
                    </p>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid md:grid-cols-3 gap-4 auto-rows-auto">

                    {/* Cell A: Main Value Prop (Large - spans 2 cols) */}
                    <div className="md:col-span-2 rounded-3xl bg-neutral-900/50 border border-white/5 p-8 relative overflow-hidden group hover:border-white/10 transition-colors bg-noise">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 opacity-50"></div>
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">零风险保障</h3>
                                <p className="text-neutral-400 leading-relaxed">我们的 AI 能将复杂目标分解为子任务并自动执行。不仅是聊天机器人，更是你的专属团队。</p>
                            </div>

                            {/* Visual Mockup */}
                            <div className="mt-8 rounded-xl bg-neutral-950 border border-white/5 p-4 shadow-2xl">
                                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                                    <div className="text-xs text-neutral-500">任务：自动驾驶研究</div>
                                    <div className="text-xs text-emerald-500 font-mono">状态：已验证</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-3/4 bg-neutral-800 rounded"></div>
                                    <div className="h-2 w-1/2 bg-neutral-800 rounded"></div>
                                    <div className="h-2 w-5/6 bg-neutral-800 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cell B: Live Agent Counter */}
                    <div className="rounded-3xl bg-neutral-900/50 border border-white/5 p-6 relative overflow-hidden hover:border-white/10 transition-colors bg-noise">
                        <div className="h-full flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                    <Activity className="w-5 h-5" />
                                </div>
                                {/* Simple static signal bars */}
                                <div className="flex items-end gap-1">
                                    <div className="w-1.5 h-4 bg-emerald-500/60 rounded-full"></div>
                                    <div className="w-1.5 h-6 bg-emerald-500/80 rounded-full"></div>
                                    <div className="w-1.5 h-3 bg-emerald-500 rounded-full"></div>
                                </div>
                            </div>

                            <div className="text-center py-4">
                                <div className="text-5xl font-black text-emerald-400 tracking-tighter mb-2">
                                    24
                                </div>
                                <div className="text-sm font-bold text-neutral-400">个 Agent 正在运行</div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                                <div className="text-center">
                                    <div className="text-xl font-black text-white">847</div>
                                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">本月完成任务</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-black text-white">&lt;4m</div>
                                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">平均交付时间</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cell C: Speed */}
                    <div className="rounded-3xl bg-neutral-900/50 border border-white/5 p-6 relative overflow-hidden group hover:border-white/10 transition-colors bg-noise">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-400">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">瞬间扩展</h3>
                        <p className="text-sm text-neutral-500 mb-4">同时启动 1000 个研究代理。人工作坊需要几周的工作，我们只需几分钟。</p>
                        {/* Static mini badges */}
                        <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30"></div>
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30"></div>
                            <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30"></div>
                            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[8px] text-neutral-400">+997</div>
                        </div>
                    </div>

                    {/* Cell D: Automotive AI Use Cases */}
                    <div className="rounded-3xl bg-neutral-900/50 border border-white/5 p-6 relative overflow-hidden group hover:border-white/10 transition-colors bg-noise">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-400">
                            <Car className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">垂直行业 AI</h3>
                        <p className="text-sm text-neutral-500 mb-4">专为汽车科技、自动驾驶、芯片研发场景深度优化。</p>
                        {/* Use case pills */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400">
                                <Car size={14} />
                                自动驾驶测试报告
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400">
                                <Microscope size={14} />
                                算法训练分析
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400">
                                <BarChart3 size={14} />
                                芯片性能评估
                            </div>
                        </div>
                    </div>

                    {/* Cell E: Quality */}
                    <div className="rounded-3xl bg-neutral-900/50 border border-white/5 p-6 relative overflow-hidden group hover:border-white/10 transition-colors bg-noise">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">专家级质量</h3>
                        <p className="text-sm text-neutral-500 mb-4">每一份产出在送达前都会经过&ldquo;审核代理&rdquo;的严格评审。</p>
                        <div className="text-center py-3">
                            <div className="text-3xl font-black text-emerald-400 tracking-tight">98.7%</div>
                            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mt-1">用户满意度</div>
                        </div>
                    </div>

                    {/* Cell F: Tech Stack Logos Row */}
                    <div className="md:col-span-3 h-20 rounded-2xl bg-neutral-900/30 border border-white/5 flex flex-col items-center justify-center gap-2 px-6">
                        <span className="text-[10px] uppercase tracking-widest text-neutral-600">Powered by</span>
                        <div className="flex items-center justify-center gap-3 md:gap-6 opacity-60">
                            <span className="px-3 py-1.5 rounded-lg text-xs font-black border bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hidden sm:inline-block">LangGraph</span>
                            <span className="px-3 py-1.5 rounded-lg text-xs font-black border bg-blue-500/20 text-blue-400 border-blue-500/30 hidden sm:inline-block">Gemini</span>
                            <span className="px-3 py-1.5 rounded-lg text-xs font-black border bg-purple-500/20 text-purple-400 border-purple-500/30 hidden sm:inline-block">Claude</span>
                            <span className="px-3 py-1.5 rounded-lg text-xs font-black border bg-teal-500/20 text-teal-400 border-teal-500/30 hidden sm:inline-block">GPT-4o</span>
                            <span className="px-3 py-1.5 rounded-lg text-xs font-black border bg-orange-500/20 text-orange-400 border-orange-500/30 hidden sm:inline-block">FastAPI</span>
                            <span className="px-3 py-1.5 rounded-lg text-xs font-black border bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hidden sm:inline-block">LangChain</span>
                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 sm:hidden">LangGraph</span>
                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 sm:hidden">Claude</span>
                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 sm:hidden">FastAPI</span>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
