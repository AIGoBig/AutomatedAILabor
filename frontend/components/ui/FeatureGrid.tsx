export default function FeatureGrid() {
    return (
        <section id="features" className="py-24 px-6 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-6">为什么选择“自动化劳动力”？</h2>
                    <p className="text-neutral-400 max-w-2xl mx-auto">我们重新定义了 AI 的工作方式。无需提示词工程，无需冗长对话，直接交付成果。</p>
                </div>

                <div className="grid md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[600px]">

                    {/* Card 1: Main Value Prop (Large) */}
                    <div className="md:col-span-2 md:row-span-2 rounded-3xl bg-neutral-900/50 border border-white/5 p-8 relative overflow-hidden group hover:border-white/10 transition-colors bg-noise">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">零风险保障</h3>
                                <p className="text-neutral-400 leading-relaxed">我们的 AI 能将复杂目标分解为子任务并自动执行。不仅是聊天机器人，更是你的专属团队。</p>
                            </div>

                            {/* Visual Mockup */}
                            <div className="mt-8 rounded-xl bg-neutral-950 border border-white/5 p-4 shadow-2xl translate-y-4 group-hover:translate-y-2 transition-transform duration-500">
                                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                                    <div className="text-xs text-neutral-500">任务：Scale-1 研究</div>
                                    <div className="text-xs text-emerald-500 font-mono">状态：已验证</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-3/4 bg-neutral-800 rounded animate-pulse"></div>
                                    <div className="h-2 w-1/2 bg-neutral-800 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Speed */}
                    <div className="rounded-3xl bg-neutral-900/50 border border-white/5 p-8 relative overflow-hidden group hover:border-white/10 transition-colors bg-noise">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-cyan-500/20 transition-all duration-500"></div>
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">瞬间扩展</h3>
                        <p className="text-sm text-neutral-500">同时启动 1000 个研究代理。人工作坊需要几周的工作，我们只需几分钟。</p>
                    </div>

                    {/* Card 3: Quality */}
                    <div className="rounded-3xl bg-neutral-900/50 border border-white/5 p-8 relative overflow-hidden group hover:border-white/10 transition-colors bg-noise">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">专家级质量</h3>
                        <p className="text-sm text-neutral-500">每一份产出在送达前都会经过“审核代理”的严格评审。</p>
                    </div>

                </div>
            </div>
        </section>
    );
}
