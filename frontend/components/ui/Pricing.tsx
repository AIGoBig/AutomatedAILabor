"use client";

import Link from 'next/link';

export default function Pricing() {
    return (
        <section id="pricing" className="py-24 px-6 relative z-10 bg-black">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-sm font-bold text-emerald-500 uppercase tracking-[0.3em] mb-4">Transparency</h2>
                    <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">更简单的定价模式</h3>
                    <p className="text-neutral-500 max-w-xl mx-auto">
                        摒弃复杂的订阅包月。在 Automated AI Labor，您只需为有效交付的结果中所消耗的 Token 付费。
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Deep Research Card */}
                    <div className="relative p-8 rounded-3xl bg-neutral-900/50 border border-emerald-500/20 shadow-2xl overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-4">
                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Available Now</span>
                        </div>

                        <div className="mb-8">
                            <h4 className="text-xl font-bold text-white mb-2">深度研究代理</h4>
                            <p className="text-neutral-500 text-sm">由 5 个以上的子代理协同，完成全网信息搜寻、分析与聚合。</p>
                        </div>

                        <div className="mb-8 flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">按有效结果</span>
                        </div>
                        <div className="mb-8 flex items-baseline gap-1 -mt-4">
                            <span className="text-2xl font-bold text-emerald-400">Token</span>
                            <span className="text-neutral-500 font-medium">计费</span>
                        </div>

                        <ul className="space-y-4 mb-8">
                            {[
                                "仅对有效交付结果消耗计费",
                                "20+ 外部信源深度分析",
                                "自动去重与交叉验证",
                                "结构化报告交付 (Markdown)"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-neutral-300 font-light">
                                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <Link href="/start" className="w-full h-14 bg-emerald-500 text-black font-bold rounded-xl flex items-center justify-center hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/10">
                            立即开始项目
                        </Link>
                    </div>

                    {/* Coming Soon Card */}
                    <div className="relative p-8 rounded-3xl bg-neutral-950 border border-white/5 opacity-60">
                        <div className="absolute top-0 right-0 p-4">
                            <span className="px-3 py-1 rounded-full bg-neutral-800 text-neutral-500 text-[10px] font-bold uppercase tracking-widest">Coming Soon</span>
                        </div>

                        <div className="mb-8">
                            <h4 className="text-xl font-bold text-neutral-400 mb-2">编程助手代理</h4>
                            <p className="text-neutral-600 text-sm">直接交付可运行的代码库或功能模块。无需手动 Review。</p>
                        </div>

                        <div className="mb-8 flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-neutral-700">按有效结果</span>
                        </div>
                        <div className="mb-8 flex items-baseline gap-1 -mt-4">
                            <span className="text-2xl font-bold text-neutral-500">Token</span>
                            <span className="text-neutral-600 font-medium">计费</span>
                        </div>

                        <ul className="space-y-4 mb-8">
                            {[
                                "生产环境就绪的代码",
                                "附带自动化测试用例",
                                "多语言栈支持 (React/Python/Go)",
                                "逻辑准确性 100% 验证"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-neutral-600 font-light">
                                    <div className="w-5 h-5 border border-neutral-800 rounded-full flex-shrink-0"></div>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <button disabled className="w-full h-14 bg-neutral-900 text-neutral-600 font-bold rounded-xl cursor-not-allowed border border-white/5">
                            即将推出
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
